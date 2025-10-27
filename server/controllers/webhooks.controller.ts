import type { Request, Response } from 'express';
import { storage } from '../storage';
import { insertMessageSchema } from '@shared/schema';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import crypto from 'crypto';
import { startAutomationExecutionFunction } from './automation.controller';
import { triggerService } from 'server/services/automation-execution.service';
import { WhatsAppApiService } from 'server/services/whatsapp-api';

export const getWebhookConfigs = asyncHandler(async (req: Request, res: Response) => {
  const configs = await storage.getWebhookConfigs();
  res.json(configs);
});

export const getGlobalWebhookUrl = asyncHandler(async (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const webhookUrl = `${protocol}://${host}/webhook/d420e261-9c12-4cee-9d65-253cda8ab4bc`;
  res.json({ webhookUrl });
});

export const createWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
  const { verifyToken, appSecret, events } = req.body;
  
  if (!verifyToken) {
    throw new AppError(400, 'Verify token is required');
  }
  
  const protocol = req.protocol;
  const host = req.get('host');
  const webhookUrl = `${protocol}://${host}/webhook/d420e261-9c12-4cee-9d65-253cda8ab4bc`;
  
  const config = await storage.createWebhookConfig({
    webhookUrl,
    verifyToken,
    appSecret: appSecret || '',
    events: events || ['messages', 'message_status', 'message_template_status_update'],
    isActive: true,
    channelId: null // Global webhook
  });
  
  res.json(config);
});

export const updateWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  const config = await storage.updateWebhookConfig(id, updates);
  if (!config) {
    throw new AppError(404, 'Webhook config not found');
  }
  
  res.json(config);
});

export const deleteWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const deleted = await storage.deleteWebhookConfig(id);
  if (!deleted) {
    throw new AppError(404, 'Webhook config not found');
  }
  
  res.json({ success: true, message: 'Webhook config deleted' });
});

export const testWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // console.log("Testing webhook for config ID:", id);
  const config = await storage.getWebhookConfig(id);
  if (!config) {
    throw new AppError(404, 'Webhook config not found');
  }
  // console.log("Webhook config:", config);
  // Send a test webhook event
  const testPayload = {
    entry: [{
      id: "test-entry",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15550555555",
            phone_number_id: "test-phone-id"
          },
          test: true
        },
        field: "messages"
      }]
    }]
  };
  // console.log("Sending test webhook to:", config.webhookUrl , testPayload);
  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    // console.log('Test :::==========>' , response);
    if (!response.ok) {
      throw new AppError(500, `Test webhook failed with status ${response.status}`);
    }
    res.json({ success: true, message: 'Test webhook sent successfully' });
  } catch (error) {
    throw new AppError(500, `Failed to send test webhook: ${(error as Error).message}`);
  }
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = req.query;
  
  // Handle webhook verification
  if (mode && challenge) {
    // Get webhook config from database to check verify token
    const configs = await storage.getWebhookConfigs();
    const activeConfig = configs.find(c => c.isActive);
    
    if (mode === 'subscribe' && activeConfig && verifyToken === activeConfig.verifyToken) {
      console.log('Webhook verified');
      // Update last ping timestamp
      await storage.updateWebhookConfig(activeConfig.id, {
        lastPingAt: new Date()
      });
      return res.send(challenge);
    }
    throw new AppError(403, 'Verification failed');
  }
  
  // Handle webhook events
  const body = req.body;
  console.log('Webhook received:', JSON.stringify(body, null, 2));
  
  // Update last ping timestamp for webhook events
  const configs = await storage.getWebhookConfigs();
  const activeConfig = configs.find(c => c.isActive);
  if (activeConfig) {
    await storage.updateWebhookConfig(activeConfig.id, {
      lastPingAt: new Date()
    });
  }
  
  if (body.entry) {
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      
      for (const change of changes) {
        if (change.field === 'messages') {
          await handleMessageChange(change.value);
        } else if (change.field === 'message_template_status_update') {
          await handleTemplateStatusUpdate(change.value);
        }
      }
    }
  }
  
  res.sendStatus(200);
});

// async function handleMessageChange(value: any) {
//   const { messages, contacts, metadata, statuses } = value;
  
//   // Handle message status updates (sent, delivered, read, failed)
//   if (statuses && statuses.length > 0) {
//     await handleMessageStatuses(statuses, metadata);
//     return;
//   }
  
//   if (!messages || messages.length === 0) {
//     return;
//   }
  
//   // Find channel by phone number ID
//   const phoneNumberId = metadata?.phone_number_id;
//   if (!phoneNumberId) {
//     console.error('No phone_number_id in webhook');
//     return;
//   }
  
//   const channel = await storage.getChannelByPhoneNumberId(phoneNumberId);
//   if (!channel) {
//     console.error(`No channel found for phone_number_id: ${phoneNumberId}`);
//     return;
//   }
  
//   for (const message of messages) {
//     const { from, id: whatsappMessageId, text, type, timestamp } = message;
    
//     // Find or create conversation
//     let conversation = await storage.getConversationByPhone(from);
//     if (!conversation) {
//       // Find or create contact first
//       let contact = await storage.getContactByPhone(from);
//       if (!contact) {
//         const contactName = contacts?.find((c: any) => c.wa_id === from)?.profile?.name || from;
//         contact = await storage.createContact({
//           name: contactName,
//           phone: from,
//           channelId: channel.id
//         });
//       }
      
//       conversation = await storage.createConversation({
//         contactId: contact.id,
//         contactPhone: from,
//         contactName: contact.name || from,
//         channelId: channel.id,
//         unreadCount: 1
//       });

//     //  execute automations;
//     // const result = await startAutomationExecutionFunction(contact?.id, conversation?.id,{ from, whatsappMessageId, text, type, timestamp });
//     // console.log(result);


//     // In your webhook handler
//     await triggerService.handleNewConversation(conversation?.id, contact?.channelId, contact?.id,);

//     } else {
//       // Increment unread count


//       await storage.updateConversation(conversation.id, {
//         unreadCount: (conversation.unreadCount || 0) + 1,
//         lastMessageAt: new Date(),
//         lastMessageText:text?.body || `[${type} message]`,
//       });
//     }
    
//     console.log("Webhook Message ::>>" , text , text?.body)

//     // Create message
//     const newMessage = await storage.createMessage({
//       conversationId: conversation.id,
//       content: text?.body || `[${type} message]`,
//       fromUser: false,
//       direction: 'inbound',
//       status: 'received',
//       whatsappMessageId,
//       timestamp: new Date(parseInt(timestamp, 10) * 1000)
//     });



    
//     // Broadcast new message via WebSocket
//     if ((global as any).broadcastToConversation) {
//       (global as any).broadcastToConversation(conversation.id, {
//         type: 'new-message',
//         message: newMessage
//       });
//     }
//   }
// }

// async function handleMessageChange(value: any) {
//   const { messages, contacts, metadata, statuses } = value;
  
//   // Handle message status updates (sent, delivered, read, failed)
//   if (statuses && statuses.length > 0) {
//     await handleMessageStatuses(statuses, metadata);
//     return;
//   }
  
//   if (!messages || messages.length === 0) {
//     return;
//   }
  
//   // Find channel by phone number ID
//   const phoneNumberId = metadata?.phone_number_id;
//   if (!phoneNumberId) {
//     console.error('No phone_number_id in webhook');
//     return;
//   }
  
//   const channel = await storage.getChannelByPhoneNumberId(phoneNumberId);
//   if (!channel) {
//     console.error(`No channel found for phone_number_id: ${phoneNumberId}`);
//     return;
//   }
  
//   for (const message of messages) {
//     const { from, id: whatsappMessageId, text, type, timestamp } = message;
    
//     // Find or create conversation
//     let conversation = await storage.getConversationByPhone(from);
//     let contact = await storage.getContactByPhone(from);
//     let isNewConversation = false;
    
//     if (!conversation) {
//       // This is a new conversation
//       isNewConversation = true;
      
//       // Find or create contact first
//       if (!contact) {
//         const contactName = contacts?.find((c: any) => c.wa_id === from)?.profile?.name || from;
//         contact = await storage.createContact({
//           name: contactName,
//           phone: from,
//           channelId: channel.id
//         });
//       }
      
//       conversation = await storage.createConversation({
//         contactId: contact.id,
//         contactPhone: from,
//         contactName: contact.name || from,
//         channelId: channel.id,
//         unreadCount: 1
//       });
//     } else {
//       // Existing conversation - increment unread count
//       await storage.updateConversation(conversation.id, {
//         unreadCount: (conversation.unreadCount || 0) + 1,
//         lastMessageAt: new Date(),
//         lastMessageText: text?.body || `[${type} message]`,
//       });
//     }
    
//     console.log("Webhook Message ::>>", text, text?.body);

//     // Create message record
//     const newMessage = await storage.createMessage({
//       conversationId: conversation.id,
//       content: text?.body || `[${type} message]`,
//       fromUser: false,
//       direction: 'inbound',
//       status: 'received',
//       whatsappMessageId,
//       timestamp: new Date(parseInt(timestamp, 10) * 1000)
//     });

//     // Broadcast new message via WebSocket
//     if ((global as any).broadcastToConversation) {
//       (global as any).broadcastToConversation(conversation.id, {
//         type: 'new-message',
//         message: newMessage
//       });
//     }

//     // ============== AUTOMATION HANDLING ==============
    
//     try {
//       if (isNewConversation) {
//         // Handle new conversation automation triggers
//         console.log(`🎯 Triggering new conversation automation for: ${conversation.id}`);
//         await triggerService.handleNewConversation(
//           conversation.id, 
//           channel.id, 
//           contact.id
//         );
//       } else {
//         // Handle message received triggers (including user responses)
//         console.log(`💬 Triggering message received automation for: ${conversation.id}`);
        
//         // The triggerService.handleMessageReceived method will:
//         // 1. Check if there's a pending execution waiting for user response
//         // 2. If yes, process as user response and resume execution
//         // 3. If no, trigger normal message-based automations
        
//         await triggerService.handleMessageReceived(
//           conversation.id, 
//           {
//             content: text?.body || `[${type} message]`,
//             text: text?.body,
//             type: type,
//             from: from,
//             whatsappMessageId: whatsappMessageId,
//             timestamp: timestamp
//           }, 
//           channel.id, 
//           contact.id
//         );
//       }
//     } catch (automationError) {
//       // Log automation errors but don't fail the webhook
//       console.error(`❌ Automation error for conversation ${conversation.id}:`, automationError);
      
//       // Optionally notify monitoring/alerting systems
//       // await notifyAutomationError(conversation.id, automationError);
//     }
//   }
// }


// Enhanced webhook handler with better automation integration
async function handleMessageChange(value: any) {
  const { messages, contacts, metadata, statuses } = value;

  // Handle message status updates (sent, delivered, read, failed)
  if (statuses && statuses.length > 0) {
    await handleMessageStatuses(statuses, metadata);
    return;
  }

  if (!messages || messages.length === 0) {
    return;
  }

  // Find channel by phone number ID
  const phoneNumberId = metadata?.phone_number_id;
  if (!phoneNumberId) {
    console.error("No phone_number_id in webhook");
    return;
  }

  const channel = await storage.getChannelByPhoneNumberId(phoneNumberId);
  if (!channel) {
    console.error(`No channel found for phone_number_id: ${phoneNumberId}`);
    return;
  }

  // Create WhatsApp API service instance for fetching media
  const waApi = new WhatsAppApiService(channel);

  for (const message of messages) {
    const { from, id: whatsappMessageId, text, type, timestamp, interactive } = message;

    // Extract message content and interactive data
    let messageContent = "";
    let interactiveData: any = null;

    // Media fields
    let mediaId: string | null = null;
    let mediaUrl: string | null = null;
    let mediaMimeType: string | null = null;
    let mediaSha256: string | null = null;

    if (type === "text" && text) {
      messageContent = text.body;
    } else if (type === "interactive" && interactive) {
      if (interactive.type === "button_reply") {
        messageContent = interactive.button_reply.title;
        interactiveData = interactive;
        console.log("Interactive button response:", interactive.button_reply);
      } else if (interactive.type === "list_reply") {
        messageContent = interactive.list_reply.title;
        interactiveData = interactive;
        console.log("Interactive list response:", interactive.list_reply);
      }
    } else if (type === "image" && message.image) {
      messageContent = message.image.caption || "[Image]";
      mediaId = message.image.id;
      mediaMimeType = message.image.mime_type;
      mediaSha256 = message.image.sha256;
    } else if (type === "document" && message.document) {
      messageContent =
        message.document.caption ||
        `[Document: ${message.document.filename || "file"}]`;
      mediaId = message.document.id;
      mediaMimeType = message.document.mime_type;
      mediaSha256 = message.document.sha256;
    } else if (type === "audio" && message.audio) {
      messageContent = "[Audio message]";
      mediaId = message.audio.id;
      mediaMimeType = message.audio.mime_type;
      mediaSha256 = message.audio.sha256;
    } else if (type === "video" && message.video) {
      messageContent = message.video.caption || "[Video]";
      mediaId = message.video.id;
      mediaMimeType = message.video.mime_type;
      mediaSha256 = message.video.sha256;
    } else {
      messageContent = `[${type} message]`;
    }

    // If media exists, fetch its temporary URL
    if (mediaId) {
      try {
        mediaUrl = await waApi.fetchMediaUrl(mediaId);
      } catch (err) {
        console.error("❌ Failed to fetch media URL:", err);
      }
    }

    // Find or create conversation
    let conversation = await storage.getConversationByPhone(from);
    let contact = await storage.getContactByPhone(from);
    let isNewConversation = false;

    if (!conversation) {
      isNewConversation = true;

      if (!contact) {
        const contactName =
          contacts?.find((c: any) => c.wa_id === from)?.profile?.name || from;
        contact = await storage.createContact({
          name: contactName,
          phone: from,
          channelId: channel.id,
        });
      }

      conversation = await storage.createConversation({
        contactId: contact.id,
        contactPhone: from,
        contactName: contact.name || from,
        channelId: channel.id,
        unreadCount: 1,
      });
    } else {
      await storage.updateConversation(conversation.id, {
        unreadCount: (conversation.unreadCount || 0) + 1,
        lastMessageAt: new Date(),
        lastMessageText: messageContent,
      });
    }

    console.log(
      "Webhook Message:",
      messageContent,
      "Type:",
      type,
      "Interactive:",
      !!interactiveData
    );

    // Create message record
    const newMessage = await storage.createMessage({
      conversationId: conversation.id,
      content: messageContent,
      fromUser: false,
      direction: "inbound",
      status: "received",
      whatsappMessageId,
      messageType: type,
      metadata: interactiveData ? JSON.stringify(interactiveData) : null,
      timestamp: new Date(parseInt(timestamp, 10) * 1000),

      // Media fields
      mediaId,
      mediaUrl,
      mediaMimeType,
      mediaSha256,
    });

    // Broadcast new message via WebSocket
    if ((global as any).broadcastToConversation) {
      (global as any).broadcastToConversation(conversation.id, {
        type: "new-message",
        message: newMessage,
      });
    }

    // --- Automation handling (unchanged) ---
    try {
      const hasPendingExecution =
        triggerService.getExecutionService().hasPendingExecution(conversation.id);

      if (hasPendingExecution) {
        console.log(
          `Processing as user response to pending automation execution`
        );

        const result =
          await triggerService.getExecutionService().handleUserResponse(
            conversation.id,
            messageContent,
            interactiveData
          );

        if (result && result.success) {
          console.log(
            `Successfully processed user response for execution ${result.executionId}`
          );

          if ((global as any).broadcastToConversation) {
            (global as any).broadcastToConversation(conversation.id, {
              type: "automation-resumed",
              data: {
                executionId: result.executionId,
                userResponse: result.userResponse,
                savedVariable: result.savedVariable,
                resumedAt: result.resumedAt,
              },
            });
          }

          continue;
        } else {
          console.warn(
            `Failed to process user response, will try triggering new automations`
          );
        }
      }

      if (isNewConversation) {
        console.log(
          `New conversation automation trigger for: ${conversation.id}`
        );
        await triggerService.handleNewConversation(
          conversation.id,
          channel.id,
          contact?.id
        );
      } else {
        console.log(
          `Message received automation trigger for: ${conversation.id}`
        );
        console.log(
          `Debug info - Channel ID: ${channel.id}, Message: "${messageContent}"`
        );

        const messageData = {
          content: messageContent,
          text: messageContent,
          body: messageContent,
          type: type,
          from: from,
          whatsappMessageId: whatsappMessageId,
          timestamp: timestamp,
          interactive: interactiveData,
          messageType: type,
          hasInteraction: !!interactiveData,
          buttonId: interactiveData?.button_reply?.id || null,
          buttonTitle: interactiveData?.button_reply?.title || null,
          listId: interactiveData?.list_reply?.id || null,
          listTitle: interactiveData?.list_reply?.title || null,
        };

        await triggerService.handleMessageReceived(
          conversation.id,
          messageData,
          channel.id,
          contact?.id
        );
      }
    } catch (automationError) {
      console.error(
        `❌ Automation error for conversation ${conversation.id}:`,
        automationError
      );

      if ((global as any).broadcastToConversation) {
        (global as any).broadcastToConversation(conversation.id, {
          type: "automation-error",
          error: {
            message: (automationError as Error).message,
            conversationId: conversation.id,
            timestamp: new Date(),
          },
        });
      }
    }
  }
}


async function handleMessageStatuses(statuses: any[], metadata: any) {
  const phoneNumberId = metadata?.phone_number_id;
  if (!phoneNumberId) {
    console.error('No phone_number_id in webhook status update');
    return;
  }

  const channel = await storage.getChannelByPhoneNumberId(phoneNumberId);
  if (!channel) {
    console.error(`No channel found for phone_number_id: ${phoneNumberId}`);
    return;
  }

  for (const statusUpdate of statuses) {
    const { id: whatsappMessageId, status, timestamp, errors, recipient_id } = statusUpdate;
    
    console.log(`📊 Message status update: ${whatsappMessageId} - ${status}`, errors ? `Errors: ${errors.length}` : '');
    
    // Find the message by WhatsApp ID
    const message = await storage.getMessageByWhatsAppId(whatsappMessageId);
    if (!message) {
      console.log(`⚠️ Message not found for WhatsApp ID: ${whatsappMessageId}`);
      continue;
    }

    // Map WhatsApp status to our status
    let messageStatus: 'sent' | 'delivered' | 'read' | 'failed' = 'sent';
    let errorDetails = null;
    
    if (status === 'sent') {
      messageStatus = 'sent';
    } else if (status === 'delivered') {
      messageStatus = 'delivered';
    } else if (status === 'read') {
      messageStatus = 'read';
    } else if (status === 'failed' && errors && errors.length > 0) {
      messageStatus = 'failed';
      // Capture the error details
      const error = errors[0];
      errorDetails = {
        code: error.code,
        title: error.title,
        message: error.message || error.details,
        errorData: error.error_data,
        recipientId: recipient_id,
        timestamp: timestamp
      };
      
      console.error(`❌ Message failed with error:`, errorDetails);
    }

    // Update message status and error details
    const updatedMessage = await storage.updateMessage(message.id, {
      status: messageStatus,
      errorDetails: errorDetails ? JSON.stringify(errorDetails) : null,
      deliveredAt: messageStatus === 'delivered' ? new Date(parseInt(timestamp, 10) * 1000) : message.deliveredAt,
      readAt: messageStatus === 'read' ? new Date(parseInt(timestamp, 10) * 1000) : message.readAt,
      updatedAt: new Date()
    });

    // Broadcast status update
    if ((global as any).broadcastToConversation && message.conversationId) {
      (global as any).broadcastToConversation(message.conversationId, {
        type: 'message-status-update',
        data: {
          messageId: message.id,
          whatsappMessageId,
          status: messageStatus,
          errorDetails,
          timestamp: new Date(parseInt(timestamp, 10) * 1000)
        }
      });
    }

    // If message has a campaign ID, update campaign stats
    if (message.campaignId) {
      const campaign = await storage.getCampaign(message.campaignId);
      if (campaign) {
        const updates: any = {};
        
        if (messageStatus === 'delivered' && message.status !== 'delivered') {
          updates.deliveredCount = (campaign.deliveredCount || 0) + 1;
        } else if (messageStatus === 'read' && message.status !== 'read') {
          updates.readCount = (campaign.readCount || 0) + 1;
        } else if (messageStatus === 'failed' && message.status !== 'failed') {
          updates.failedCount = (campaign.failedCount || 0) + 1;
          // Only decrease sent count if message was previously marked as sent
          if (message.status === 'sent') {
            updates.sentCount = Math.max(0, (campaign.sentCount || 0) - 1);
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await storage.updateCampaign(campaign.id, updates);
        }
      }
    }
  }
}

async function handleTemplateStatusUpdate(value: any) {
  const { message_template_id, message_template_name, event, reason } = value;
  
  console.log(`Template status update: ${message_template_name} - ${event}${reason ? ` - Reason: ${reason}` : ''}`);
  
  if (message_template_id && event) {
    // Map WhatsApp status to our status
    let status = 'pending';
    if (event === 'APPROVED') {
      status = 'approved';
    } else if (event === 'REJECTED') {
      status = 'rejected';
    }
    
    // Update template status in database
    const templates = await storage.getTemplates();
    const template = templates.find(t => t.whatsappTemplateId === message_template_id);
    
    if (template) {
      const updateData: any = { status };
      // If rejected, save the rejection reason
      if (event === 'REJECTED' && reason) {
        updateData.rejectionReason = reason;
      }
      await storage.updateTemplate(template.id, updateData);
      console.log(`Updated template ${template.name} status to ${status}${reason ? ` with reason: ${reason}` : ''}`);
    }
  }
}


// ============== ADDITIONAL HELPER FUNCTIONS ==============

/**
 * Get automation execution status for a conversation
 * Useful for debugging and monitoring
 */
export const getConversationAutomationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  
  const executionService = triggerService.getExecutionService();
  const hasPending = executionService.hasPendingExecution(conversationId);
  const pendingExecutions = executionService.getPendingExecutions().filter(
    pe => pe.conversationId === conversationId
  );
  
  res.json({
    conversationId,
    hasPendingExecution: hasPending,
    pendingExecutions,
    totalPendingCount: pendingExecutions.length
  });
});

/**
 * Cancel automation execution for a conversation
 * Useful for manual intervention
 */
export const cancelConversationAutomation = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  
  const executionService = triggerService.getExecutionService();
  const cancelled = await executionService.cancelExecution(conversationId);
  
  res.json({
    success: cancelled,
    conversationId,
    message: cancelled 
      ? 'Automation execution cancelled successfully'
      : 'No pending execution found for this conversation'
  });
});

/**
 * Get all pending executions across all conversations
 * Useful for monitoring dashboard
 */
export const getAllPendingExecutions = asyncHandler(async (req: Request, res: Response) => {
  const executionService = triggerService.getExecutionService();
  const pendingExecutions = executionService.getPendingExecutions();
  
  res.json({
    totalCount: pendingExecutions.length,
    executions: pendingExecutions
  });
});

/**
 * Cleanup expired executions manually
 * Can be called via API or scheduled job
 */
export const cleanupExpiredExecutions = asyncHandler(async (req: Request, res: Response) => {
  const { timeoutMinutes = 30 } = req.query;
  const timeoutMs = parseInt(timeoutMinutes as string) * 60 * 1000;
  
  const executionService = triggerService.getExecutionService();
  const cleanedCount = await executionService.cleanupExpiredExecutions(timeoutMs);
  
  res.json({
    success: true,
    cleanedCount,
    message: `Cleaned up ${cleanedCount} expired executions`
  });
});