// import type { Express } from "express";
// import * as analyticsController from "../controllers/analytics.controller";
// import * as dashboardController from "../controllers/dashboard.controller";
// import { extractChannelId } from "../middlewares/channel.middleware";
// import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
// import { PERMISSIONS } from "@shared/schema";


// export function registerAnalyticsRoutes(app: Express) {
//   // Legacy analytics endpoint for backward compatibility
//   app.get("/api/analytics",requireAuth,
//   requirePermission(PERMISSIONS.ANALYTICS_VIEW), dashboardController.getAnalytics);
  
//   // New comprehensive analytics endpoints
//   app.get("/api/analytics/messages", analyticsController.getMessageAnalytics);
//   app.get("/api/analytics/campaigns", analyticsController.getCampaignAnalytics);
//   app.get("/api/analytics/campaigns/:campaignId", analyticsController.getCampaignAnalyticsById);
//   app.get("/api/analytics/export",requireAuth,
//   requirePermission(PERMISSIONS.ANALYTICS_EXPORT), analyticsController.exportAnalytics);
// }


import type { Express } from "express";
import * as panelController from "../controllers/panel.config.controller";
import { upload } from "../middlewares/upload.middleware";

export function registerPanelConfigRoutes(app: Express) {
  // Create panel config
  app.post(
    "/api/panel",
    upload.fields([{ name: "logo", maxCount: 1 }, { name: "favicon", maxCount: 1 }]),
    panelController.create
  );

  // Get all panel configs
  app.get("/api/panel", panelController.getAll);
  
  // Get single panel config by ID
  app.get("/api/panel/:id", panelController.getOne);

  // Update panel config
  app.put(
    "/api/panel/:id",
    upload.fields([{ name: "logo", maxCount: 1 }, { name: "favicon", maxCount: 1 }]),
    panelController.update
  );

  // Delete panel config
  app.delete("/api/panel/:id", panelController.remove);

  // Brand settings endpoints (aliases for frontend compatibility)
  app.get("/api/brand-settings", panelController.getBrandSettings);
  app.put("/api/brand-settings",upload.fields([{ name: "logo", maxCount: 1 }, { name: "favicon", maxCount: 1 }]), panelController.updateBrandSettings);
  app.post("/api/brand-settings",upload.fields([{ name: "logo", maxCount: 1 }, { name: "favicon", maxCount: 1 }]), panelController.createBrandSettings);
}