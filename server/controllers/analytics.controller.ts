import type { Request, Response } from 'express';
import { db } from '../db';
import { messages, campaigns, conversations, whatsappChannels } from '@shared/schema';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { eq, and, gte, lte, count, sql, desc } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import ExcelJS from "exceljs";
import { storage } from 'server/storage';

// Get message analytics with real-time data
export const getMessageAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { channelId, days = '30', startDate, endDate } = req.query;
  
  const daysNum = parseInt(days as string, 10);
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const conditions = [];
  
  if (channelId) {
    conditions.push(eq(conversations.channelId, channelId as string));
  }
  
  conditions.push(gte(messages.createdAt, start));
  conditions.push(lte(messages.createdAt, end));

  // Get message statistics
  const messageStats = await db
    .select({
      date: sql<string>`DATE(${messages.createdAt})`,
      totalSent: count(messages.id),
      delivered: sql<number>`COUNT(CASE WHEN ${messages.status} = 'delivered' THEN 1 END)`,
      read: sql<number>`COUNT(CASE WHEN ${messages.status} = 'read' THEN 1 END)`,
      failed: sql<number>`COUNT(CASE WHEN ${messages.status} = 'failed' THEN 1 END)`,
      pending: sql<number>`COUNT(CASE WHEN ${messages.status} = 'pending' THEN 1 END)`,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(...conditions))
    .groupBy(sql`DATE(${messages.createdAt})`)
    .orderBy(sql`DATE(${messages.createdAt})`);

  // Get overall statistics
  const overallStats = await db
    .select({
      totalMessages: count(messages.id),
      totalDelivered: sql<number>`COUNT(CASE WHEN ${messages.status} = 'delivered' THEN 1 END)`,
      totalRead: sql<number>`COUNT(CASE WHEN ${messages.status} = 'read' THEN 1 END)`,
      totalFailed: sql<number>`COUNT(CASE WHEN ${messages.status} = 'failed' THEN 1 END)`,
      totalReplied: sql<number>`COUNT(CASE WHEN ${messages.fromUser} = true THEN 1 END)`,
      uniqueContacts: sql<number>`COUNT(DISTINCT ${conversations.contactPhone})`,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(...conditions));

  // Get message type breakdown
  const messageTypes = await db
    .select({
      direction: messages.direction,
      count: count(messages.id),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(...conditions))
    .groupBy(messages.direction);

  // Get hourly distribution
  const hourlyDistribution = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${messages.createdAt})`,
      count: count(messages.id),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(...conditions))
    .groupBy(sql`EXTRACT(HOUR FROM ${messages.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${messages.createdAt})`);

  res.json({
    dailyStats: messageStats,
    overall: overallStats[0] || {},
    messageTypes,
    hourlyDistribution,
    period: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days: daysNum,
    },
  });
});

// Get campaign analytics
export const getCampaignAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { channelId } = req.query;
  
  const conditions = [];
  if (channelId) {
    conditions.push(eq(campaigns.channelId, channelId as string));
  }

  // Get campaign performance data - simplified query
  const campaignStats = await db
    .select()
    .from(campaigns)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(campaigns.createdAt));

  // Calculate rates in JavaScript
  const campaignsWithRates = campaignStats.map(campaign => ({
    ...campaign,
    deliveryRate: (campaign.sentCount && campaign.sentCount > 0)
      ? ((campaign.deliveredCount || 0) / campaign.sentCount) * 100 
      : 0,
    readRate: (campaign.deliveredCount && campaign.deliveredCount > 0)
      ? ((campaign.readCount || 0) / campaign.deliveredCount) * 100 
      : 0,
    replyRate: (campaign.readCount && campaign.readCount > 0)
      ? ((campaign.repliedCount || 0) / campaign.readCount) * 100 
      : 0,
  }));

  // Calculate aggregated stats in JavaScript
  const aggregatedStats = campaignStats.reduce((acc, campaign) => ({
    totalCampaigns: acc.totalCampaigns + 1,
    activeCampaigns: acc.activeCampaigns + (campaign.status === 'active' ? 1 : 0),
    completedCampaigns: acc.completedCampaigns + (campaign.status === 'completed' ? 1 : 0),
    totalRecipients: acc.totalRecipients + (campaign.recipientCount || 0),
    totalSent: acc.totalSent + (campaign.sentCount || 0),
    totalDelivered: acc.totalDelivered + (campaign.deliveredCount || 0),
    totalRead: acc.totalRead + (campaign.readCount || 0),
    totalReplied: acc.totalReplied + (campaign.repliedCount || 0),
    totalFailed: acc.totalFailed + (campaign.failedCount || 0),
  }), {
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalRecipients: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalReplied: 0,
    totalFailed: 0,
  });

  res.json({
    campaigns: campaignsWithRates,
    summary: aggregatedStats,
  });
});

// Get individual campaign analytics
export const getCampaignAnalyticsById = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;

  // Get campaign details
  console.log("Fetching campaign analytics for ID:", campaignId);

  const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
console.log("Campaign details:", campaign);

  // Get daily message stats for this campaign
  const endDate = new Date();
  const startDate = new Date(campaign.createdAt || new Date());
  
  const dailyStats = await db
    .select({
      date: sql<string>`DATE(${messages.timestamp})`,
      sent: count(messages.id),
      delivered: sql<number>`COUNT(CASE WHEN ${messages.status} = 'delivered' THEN 1 END)`,
      read: sql<number>`COUNT(CASE WHEN ${messages.status} = 'read' THEN 1 END)`,
      failed: sql<number>`COUNT(CASE WHEN ${messages.status} = 'failed' THEN 1 END)`,
    })
    .from(messages)
    .where(eq(messages.campaignId, campaignId))
    .groupBy(sql`DATE(${messages.timestamp})`)
    .orderBy(sql`DATE(${messages.timestamp})`);

  // Get recipient status distribution
  const recipientStats = await db
    .select({
      status: messages.status,
      count: count(messages.id),
    })
    .from(messages)
    .where(eq(messages.campaignId, campaignId))
    .groupBy(messages.status);

  // Get error analysis
  const errorAnalysis = await db
    .select({
      errorCode: sql<string>`${messages.errorDetails}->>'code'`,
      errorMessage: sql<string>`${messages.errorDetails}->>'message'`,
      count: count(messages.id),
    })
    .from(messages)
    .where(and(
      eq(messages.campaignId, campaignId),
      eq(messages.status, 'failed')
    ))
    .groupBy(sql`${messages.errorDetails}->>'code'`, sql`${messages.errorDetails}->>'message'`)
    .orderBy(desc(count(messages.id)));
console.log("Data", {campaign,
  dailyStats,
  recipientStats,
  errorAnalysis,});

  res.status(200).json({
    campaign,
    dailyStats,
    recipientStats,
    errorAnalysis,
  });
});

// Get individual campaign details
export const getCampaignDetails = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;

  const campaign = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign.length) {
    throw new AppError(404, 'Campaign not found');
  }

  // Get message statistics for this campaign
  const messageStats = await db
    .select({
      date: sql<string>`DATE(${messages.createdAt})`,
      sent: count(messages.id),
      delivered: sql<number>`COUNT(CASE WHEN ${messages.status} = 'delivered' THEN 1 END)`,
      read: sql<number>`COUNT(CASE WHEN ${messages.status} = 'read' THEN 1 END)`,
      failed: sql<number>`COUNT(CASE WHEN ${messages.status} = 'failed' THEN 1 END)`,
    })
    .from(messages)
    .where(eq(messages.campaignId, campaignId))
    .groupBy(sql`DATE(${messages.createdAt})`)
    .orderBy(sql`DATE(${messages.createdAt})`);

  // Get recipient performance
  const recipientStats = await db
    .select({
      status: messages.status,
      count: count(messages.id),
    })
    .from(messages)
    .where(eq(messages.campaignId, campaignId))
    .groupBy(messages.status);

  // Get error analysis
  const errorAnalysis = await db
    .select({
      errorCode: messages.errorCode,
      errorMessage: messages.errorMessage,
      count: count(messages.id),
    })
    .from(messages)
    .where(and(
      eq(messages.campaignId, campaignId),
      eq(messages.status, 'failed')
    ))
    .groupBy(messages.errorCode, messages.errorMessage);

  res.json({
    campaign: campaign[0],
    dailyStats: messageStats,
    recipientStats,
    errorAnalysis,
  });
});

// Export analytics report
export const exportAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { format = 'pdf', type = 'messages', channelId, days = '30' } = req.query;
  
  if (format === 'pdf') {
    await exportPDF(req, res);
  } else if (format === 'excel') {
    await exportExcel(req, res);
  } else {
    throw new AppError(400, 'Invalid export format');
  }
});

// Helper function to export PDF
async function exportPDF(req: Request, res: Response) {
  const { type, channelId, days = '30' } = req.query;
  
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  
  doc.pipe(res);
  
  // Add title
  doc.fontSize(20).text('WhatsApp Analytics Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);

  // Get data based on type
  if (type === 'messages' || type === 'all') {
    // Fetch message analytics data
    const daysNum = parseInt(days as string);
    const start = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
    
    const conditions = [];
    if (channelId) {
      conditions.push(eq(conversations.channelId, channelId as string));
    }
    conditions.push(gte(messages.createdAt, start));

    const stats = await db
      .select({
        totalMessages: count(messages.id),
        delivered: sql<number>`COUNT(CASE WHEN ${messages.status} = 'delivered' THEN 1 END)`,
        read: sql<number>`COUNT(CASE WHEN ${messages.status} = 'read' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN ${messages.status} = 'failed' THEN 1 END)`,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(...conditions));

    doc.fontSize(16).text('Message Statistics', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Messages: ${stats[0]?.totalMessages || 0}`);
    doc.text(`Delivered: ${stats[0]?.delivered || 0}`);
    doc.text(`Read: ${stats[0]?.read || 0}`);
    doc.text(`Failed: ${stats[0]?.failed || 0}`);
    doc.moveDown(2);
  }

  if (type === 'campaigns' || type === 'all') {
    // Add campaign statistics
    const campaignStats = await db
      .select({
        totalCampaigns: count(campaigns.id),
        totalSent: sql<number>`SUM(${campaigns.sentCount})`,
        totalDelivered: sql<number>`SUM(${campaigns.deliveredCount})`,
      })
      .from(campaigns)
      .where(channelId ? eq(campaigns.channelId, channelId as string) : undefined);

    doc.fontSize(16).text('Campaign Statistics', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Campaigns: ${campaignStats[0]?.totalCampaigns || 0}`);
    doc.text(`Total Sent: ${campaignStats[0]?.totalSent || 0}`);
    doc.text(`Total Delivered: ${campaignStats[0]?.totalDelivered || 0}`);
  }

  doc.end();
}

// Helper function to export Excel
export async function exportExcel(req: Request, res: Response) {
  const { type, channelId, days = "30" } = req.query;

  const workbook = new ExcelJS.Workbook();

  // ----------------------
  // Message Analytics Sheet
  // ----------------------
  if (type === "messages" || type === "all") {
    const daysNum = parseInt(days as string, 10);
    const start = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const conditions = [];
    if (channelId) {
      conditions.push(eq(conversations.channelId, channelId as string));
    }
    conditions.push(gte(messages.createdAt, start));

    const messageData = await db
      .select({
        date: sql<string>`DATE(${messages.createdAt})`,
        sent: count(messages.id),
        delivered: sql<number>`COUNT(CASE WHEN ${messages.status} = 'delivered' THEN 1 END)`,
        read: sql<number>`COUNT(CASE WHEN ${messages.status} = 'read' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN ${messages.status} = 'failed' THEN 1 END)`,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(...conditions))
      .groupBy(sql`DATE(${messages.createdAt})`)
      .orderBy(sql`DATE(${messages.createdAt})`);

    const ws = workbook.addWorksheet("Message Analytics");

    if (messageData.length > 0) {
      // Add header row
      ws.columns = Object.keys(messageData[0]).map((key) => ({
        header: key.charAt(0).toUpperCase() + key.slice(1),
        key,
        width: 15,
      }));

      // Add data rows
      messageData.forEach((row) => ws.addRow(row));
    }
  }

  // ----------------------
  // Campaign Analytics Sheet
  // ----------------------
  if (type === "campaigns" || type === "all") {
    const campaignData = await db
      .select({
        name: campaigns.name,
        type: campaigns.type,
        status: campaigns.status,
        recipients: campaigns.recipientCount,
        sent: campaigns.sentCount,
        delivered: campaigns.deliveredCount,
        read: campaigns.readCount,
        replied: campaigns.repliedCount,
        failed: campaigns.failedCount,
      })
      .from(campaigns)
      .where(channelId ? eq(campaigns.channelId, channelId as string) : undefined)
      .orderBy(desc(campaigns.createdAt));

    const ws = workbook.addWorksheet("Campaign Analytics");

    if (campaignData.length > 0) {
      ws.columns = Object.keys(campaignData[0]).map((key) => ({
        header: key.charAt(0).toUpperCase() + key.slice(1),
        key,
        width: 15,
      }));

      campaignData.forEach((row) => ws.addRow(row));
    }
  }

  // ----------------------
  // Write Excel to buffer
  // ----------------------
  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=analytics-report-${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`
  );
  res.send(buffer);
}
