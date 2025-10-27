import type { Express } from "express";
import * as templatesController from "../controllers/templates.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { insertTemplateSchema } from "@shared/schema";
import { extractChannelId } from "../middlewares/channel.middleware";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { PERMISSIONS } from "@shared/schema";

export function registerTemplateRoutes(app: Express) {
  // Get all templates
  app.get("/api/templates",
    extractChannelId,requireAuth,
    requirePermission(PERMISSIONS.TEMPLATES_VIEW),
    templatesController.getTemplates
  );

  // Get single template
  app.get("/api/templates/:id",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_VIEW), templatesController.getTemplate);

  // Create template
  app.post("/api/templates",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_CREATE),
    validateRequest(insertTemplateSchema),
    templatesController.createTemplate
  );

  // Update template
  app.put("/api/templates/:id",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_EDIT), templatesController.updateTemplate);

  // Delete template
  app.delete("/api/templates/:id",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_DELETE), templatesController.deleteTemplate);

  // Sync templates with WhatsApp
  app.post("/api/templates/sync",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_SYNC), templatesController.syncTemplates);

  // Seed templates
  app.post("/api/templates/seed",
    extractChannelId,
    templatesController.seedTemplates
  );
}