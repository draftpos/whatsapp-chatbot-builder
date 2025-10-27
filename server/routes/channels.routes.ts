import type { Express } from "express";
import * as channelsController from "../controllers/channels.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { insertChannelSchema } from "@shared/schema";

export function registerChannelRoutes(app: Express) {
  // Get all channels
  app.get("/api/channels", channelsController.getChannels);

  // Get active channel
  app.get("/api/channels/active", channelsController.getActiveChannel);

  // Create channel
  app.post("/api/channels", 
    validateRequest(insertChannelSchema),
    channelsController.createChannel
  );

  // Update channel
  app.put("/api/channels/:id", channelsController.updateChannel);

  // Delete channel
  app.delete("/api/channels/:id", channelsController.deleteChannel);

  // Check channel health
  app.post("/api/channels/:id/health", channelsController.checkChannelHealth);
  
  // Check all channels health
  app.post("/api/channels/health-check-all", channelsController.checkAllChannelsHealth);
}