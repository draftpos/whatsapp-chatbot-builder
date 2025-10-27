import type { Express } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { extractChannelId } from "../middlewares/channel.middleware";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { PERMISSIONS } from "@shared/schema";


export function registerDashboardRoutes(app: Express) {
  // Get dashboard statistics
  app.get("/api/dashboard/stats",
    extractChannelId,
    dashboardController.getDashboardStats
  );

  // Get analytics data
  app.get("/api/analytics",
    extractChannelId,requireAuth,
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    dashboardController.getAnalytics
  );

  // Create analytics entry
  app.post("/api/analytics", dashboardController.createAnalytics);
}