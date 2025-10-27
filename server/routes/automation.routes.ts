import { z } from "zod";
import type { Express } from "express";

import { insertAutomationSchema, insertAutomationNodeSchema } from "@shared/schema";
import { requireAuth } from "../middlewares/auth.middleware";
import { extractChannelId } from "../middlewares/channel.middleware";
// import * as automationController from "../controllers/automation.controller";

import {
  getAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
  saveAutomationNodes,
  saveAutomationEdges,
  startAutomationExecution,
  logAutomationNodeExecution,
  testAutomation,
  getExecutionStatus,
  getAutomationExecutions,
  triggerNewConversation,
  triggerMessageReceived
} from "../controllers/automation.controller";
import { cleanupExpiredExecutions, getAllPendingExecutions } from "server/controllers/webhooks.controller";
import { upload } from "server/middlewares/upload.middleware";

// Schema for automation + nodes (used for builder save)
const automationWithNodesSchema = z.object({
  automation: insertAutomationSchema,
  nodes: z.array(insertAutomationNodeSchema),
});





export function registerAutomationRoutes(app: Express) {
  //
  // ─── AUTOMATION CRUD ──────────────────────────────────────────────
  //


  // Get all automations
  app.get(
    "/api/automations",
    requireAuth,
    extractChannelId,
    getAutomations
  );

  // Get single automation with nodes
  app.get(
    "/api/automations/:id",
    requireAuth,
    extractChannelId,
    getAutomation
  );

  // Create automation
  app.post(
    "/api/automations",
    requireAuth,
    extractChannelId,
    upload.any(),
    createAutomation
  );

  // Update automation
  app.put(
    "/api/automations/:id",
    requireAuth,
    extractChannelId,
    upload.any(),
    updateAutomation
  );

  // Delete automation
  app.delete(
    "/api/automations/:id",
    requireAuth,
    extractChannelId,
    deleteAutomation
  );

  // Toggle status active/inactive
  app.post(
    "/api/automations/:id/toggle",
    requireAuth,
    extractChannelId,
    toggleAutomation
  );

  //
  // ─── NODES (visual builder) ──────────────────────────────────────
  //

  // Save automation nodes (bulk replace from builder)
  app.post(
    "/api/automations/:automationId/nodes",
    requireAuth,
    extractChannelId,
    saveAutomationNodes
  );

    // Save automation edges (bulk replace from builder)
  app.post(
    "/api/automations/:automationId/edges",
    requireAuth,
    extractChannelId,
    saveAutomationNodes
  );

  //
  // ─── EXECUTION ───────────────────────────────────────────────────
  //

  // Start execution for a contact/conversation
  app.post(
    "/api/automations/:automationId/executions",
    requireAuth,
    extractChannelId,
    startAutomationExecution
  );

  // Log node execution (worker will call this per node)
  app.post(
    "/api/automations/executions/:executionId/logs",
    requireAuth,
    extractChannelId,
    logAutomationNodeExecution
  );



// app.get("/", getAutomations);
// app.get("/:id", getAutomation);
// app.post("/", createAutomation);
// app.put("/:id", updateAutomation);
// app.delete("/:id", deleteAutomation);
// app.patch("/:id/toggle", toggleAutomation);

// Node and Edge Management
// app.post("/:automationId/nodes", saveAutomationNodes);
// app.post("/:automationId/edges", saveAutomationEdges);

// Execution
app.post("/api/automations/:automationId/execute", startAutomationExecution);
app.post("/api/automations/:id/test", testAutomation); // NEW: Manual test
app.get("/api/automations/:id/executions", getAutomationExecutions); // NEW: Get execution history
app.get("/api/automations/executions/:executionId/status", getExecutionStatus); // NEW: Get execution status

// Logging
app.post("/api/automations/executions/:executionId/logs", logAutomationNodeExecution);

// Triggers (these would typically be called from other parts of your app)
app.post("/api/automations/triggers/new-conversation", triggerNewConversation);
app.post("/api/automations/triggers/message-received", triggerMessageReceived);



app.get('/api/automations/pending-executions', getAllPendingExecutions);
app.post('/api/automations/cleanup-expired', cleanupExpiredExecutions);

}
