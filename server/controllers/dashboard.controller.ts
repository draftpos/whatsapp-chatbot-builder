import type { Request, Response } from 'express';
import { storage } from '../storage';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import type { RequestWithChannel } from '../middlewares/channel.middleware';

export const getDashboardStats = asyncHandler(async (req: RequestWithChannel, res: Response) => {
  const channelId = req.query.channelId as string | undefined;
  
  if (channelId) {
    const stats = await storage.getDashboardStatsByChannel(channelId);
    res.json(stats);
  } else {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  }
});

export const getAnalytics = asyncHandler(async (req: RequestWithChannel, res: Response) => {
  const channelId = req.query.channelId as string | undefined;
  const days = req.query.days ? parseInt(req.query.days as string) : undefined;
  
  if (channelId) {
    const analytics = await storage.getAnalyticsByChannel(channelId, days);
    res.json(analytics);
  } else {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  }
});

export const createAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await storage.createAnalytics(req.body);
  res.json(analytics);
});