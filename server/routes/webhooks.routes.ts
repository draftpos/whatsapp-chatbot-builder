import type { Express } from "express";
import * as webhooksController from "../controllers/webhooks.controller";

export function registerWebhookRoutes(app: Express) {
  // Get webhook configs
  app.get("/api/webhook-configs", webhooksController.getWebhookConfigs);
  
  // Create webhook config
  app.post("/api/webhook-configs", webhooksController.createWebhookConfig);
  
  // Update webhook config
  app.patch("/api/webhook-configs/:id", webhooksController.updateWebhookConfig);
  
  // Delete webhook config
  app.delete("/api/webhook-configs/:id", webhooksController.deleteWebhookConfig);
  
  // Test webhook
  app.post("/api/webhook-configs/:id/test", webhooksController.testWebhook);

  // Get global webhook URL
  app.get("/api/webhook/global-url", webhooksController.getGlobalWebhookUrl);

  // Global webhook endpoint
  app.all("/webhook/d420e261-9c12-4cee-9d65-253cda8ab4bc", webhooksController.handleWebhook);
}