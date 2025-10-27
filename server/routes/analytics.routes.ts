import type { Express } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import * as dashboardController from "../controllers/dashboard.controller";
import { extractChannelId } from "../middlewares/channel.middleware";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { PERMISSIONS } from "@shared/schema";


export function registerAnalyticsRoutes(app: Express) {
  // Legacy analytics endpoint for backward compatibility
  app.get("/api/analytics",requireAuth,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW), dashboardController.getAnalytics);
  
  // New comprehensive analytics endpoints
  app.get("/api/analytics/messages", analyticsController.getMessageAnalytics);
  app.get("/api/analytics/campaigns", analyticsController.getCampaignAnalytics);
  app.get("/api/analytics/campaigns/:campaignId", analyticsController.getCampaignAnalyticsById);
  app.get("/api/analytics/export",requireAuth,
  requirePermission(PERMISSIONS.ANALYTICS_EXPORT), analyticsController.exportAnalytics);
}