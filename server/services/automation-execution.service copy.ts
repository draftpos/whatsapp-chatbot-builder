// automation-execution.service.ts
import { db } from "../db";
import {
  automations,
  automationNodes,
  automationExecutions,
  automationExecutionLogs,
  automationEdges,
  contacts,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sendBusinessMessage } from "../services/messageService";
import { WhatsAppApiService } from "./whatsapp-api";
import { storage } from "server/storage";


interface ExecutionContext {
  executionId: string;
  automationId: string;
  contactId?: string;
  conversationId?: string;
  variables: Record<string, any>;
  triggerData: any;
}


interface PendingExecution {
  executionId: string;
  automationId: string;
  nodeId: string;
  conversationId: string;
  contactId?: string;
  context: ExecutionContext;
  saveAs?: string;
  timestamp: Date;
  status: 'waiting_for_response';
  expectedButtons?: any[]; // Add this line
}

export class AutomationExecutionService {
  private pendingExecutions = new Map<string, PendingExecution>();
  /**
   * Start automation execution (called from your controller)
   */
  async executeAutomation(executionId: string) {
    console.log(`Starting execution: ${executionId}`);
    
    try {
      // Get execution record
      const execution = await db.query.automationExecutions.findFirst({
        where: eq(automationExecutions.id, executionId),
      });

      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      // Get automation with nodes and edges
      const automation = await this.getAutomationWithFlow(execution.automationId);
      if (!automation) {
        throw new Error(`Automation ${execution.automationId} not found`);
      }

      // Update execution count
      await db.update(automations)
        .set({ 
          executionCount: automation.executionCount + 1,
          lastExecutedAt: new Date()
        })
        .where(eq(automations.id, execution.automationId));

      // Create execution context
      const context: ExecutionContext = {
        executionId: execution.id,
        automationId: execution.automationId,
        contactId: execution.contactId,
        conversationId: execution.conversationId,
        variables: {
          contactId: execution.contactId,
          conversationId: execution.conversationId,
          ...execution.triggerData
        },
        triggerData: execution.triggerData
      };

      // Get first node = no incoming edges
        const firstNode = automation.nodes.find(
          (n: any) => !automation.edges.some((e: any) => e.targetNodeId === n.nodeId)
        );

        if (firstNode) {
          await this.executeNode(firstNode, automation, context);
        } else {
          await this.completeExecution(executionId, 'completed', 'No start node found');
        }

    } catch (error) {
      console.error(`Error executing automation ${executionId}:`, error);
      await this.completeExecution(executionId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(node: any, automation: any, context: ExecutionContext) {
    const startTime = new Date();
    console.log(`Executing node ${node.nodeId} (${node.type})`);

    try {
      // Log node start
      await this.logNodeExecution(
        context.executionId,
        node.nodeId,
        node.type,
        'running',
        node.data,
        null,
        null
      );

      let result: any = null;

      // Execute based on node type
      switch (node.type) {
        case 'custom_reply':
          result = await this.executeCustomReply(node, context);
          break;
          
        case 'user_reply':
          result = await this.executeUserReply(node, context);
          break;
          
        case 'time_gap':
          result = await this.executeTimeGap(node, context);
          return; // Time gap handles its own continuation
          
        case 'send_template':
          result = await this.executeSendTemplate(node, context);
          break;
          
        case 'assign_user':
          result = await this.executeAssignUser(node, context);
          break;
          
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Log success
      await this.logNodeExecution(
        context.executionId,
        node.nodeId,
        node.type,
        'completed',
        node.data,
        result,
        null
      );

      // Continue to next node
      await this.continueToNextNode(node, automation, context);

    } catch (error) {
      console.error(`Error executing node ${node.nodeId}:`, error);
      
      // Log error
      await this.logNodeExecution(
        context.executionId,
        node.nodeId,
        node.type,
        'failed',
        node.data,
        null,
        error.message
      );

      // Fail the entire execution
      await this.completeExecution(context.executionId, 'failed', `Node ${node.nodeId} failed: ${error.message}`);
      throw error;
    }
  }

/**
 * Continue to next node(s) using edges
 */
private async continueToNextNode(currentNode: any, automation: any, context: ExecutionContext) {
  // Get outgoing edges
  const outgoingEdges = automation.edges.filter(
    (e: any) => e.sourceNodeId === currentNode.nodeId
  );

  if (outgoingEdges.length === 0) {
    // No more nodes → execution complete
    await this.completeExecution(context.executionId, 'completed', 'All nodes executed successfully');
    return;
  }

  // Follow each edge
  for (const edge of outgoingEdges) {
    const nextNode = automation.nodes.find((n: any) => n.nodeId === edge.targetNodeId);
    if (nextNode) {
      await this.executeNode(nextNode, automation, context);
    }
  }
}



  /**
   * Execute custom reply node
   */
  private async executeCustomReply(node: any, context: ExecutionContext) {
    const message = this.replaceVariables(node.data.message || '', context.variables);
    // console.log("node & context", node, context);
    console.log(`Sending message to conversation ${context.conversationId}: "${message}"`);
    console.log('Context variables:', context.variables);
    // TODO: Replace with your actual messaging service

    const getContact = await db.query.contacts.findFirst({
        where: eq(contacts?.id, context.contactId),
      });

      // console.log('Contact info:', getContact);

      if (getContact?.phone) {
        await sendBusinessMessage({
          to: getContact?.phone,  // make sure you pass recipient
          message,
          channelId: getContact?.channelId, // optional
        });
      }
    
    
    // Mock implementation for now
    console.log(`✅ Message sent: ${message}`);
    
    return {
      action: 'message_sent',
      message,
      conversationId: context.conversationId
    };
  }


  /**
   * Execute user reply node (question) - ENHANCED VERSION
   */
  // private async executeUserReply(node: any, context: ExecutionContext) {
  //   const question = this.replaceVariables(node.data.question || '', context.variables);
    
  //   console.log(`Asking question to conversation ${context.conversationId}: "${question}"`);
    
  //   // 1. Send the question to the user
  //   const getContact = await db.query.contacts.findFirst({
  //     where: eq(contacts?.id, context.contactId),
  //   });

  //   if (getContact?.phone) {
  //     await sendBusinessMessage({
  //       to: getContact?.phone,
  //       message: question,
  //       channelId: getContact?.channelId,
  //       conversationId: context.conversationId,
  //     });
  //   }
    
  //   // 2. Create a unique pending execution ID
  //   const pendingId = `${context.executionId}_${node.nodeId}_${Date.now()}`;
    
  //   // 3. Store the execution state for resumption
  //   const pendingExecution: PendingExecution = {
  //     executionId: context.executionId,
  //     automationId: context.automationId,
  //     nodeId: node.nodeId,
  //     conversationId: context.conversationId,
  //     contactId: context.contactId,
  //     context: { ...context },
  //     saveAs: node.data.saveAs,
  //     timestamp: new Date(),
  //     status: 'waiting_for_response'
  //   };
    
  //   this.pendingExecutions.set(pendingId, pendingExecution);
    
  //   // 4. Update execution status to paused
  //   await db.update(automationExecutions)
  //     .set({
  //       status: 'paused',
  //       result: `Waiting for user response to: "${question}"`
  //     })
  //     .where(eq(automationExecutions.id, context.executionId));
    
  //   // 5. Log that we're waiting
  //   await this.logNodeExecution(
  //     context.executionId,
  //     node.nodeId,
  //     node.type,
  //     'waiting_for_response',
  //     { ...node.data, question },
  //     { pendingId, action: 'question_sent' },
  //     null
  //   );
    
  //   console.log(`✅ Question sent: ${question}`);
  //   console.log(`⏸️  Execution paused. Waiting for user response (pending ID: ${pendingId})`);
    
  //   return {
  //     action: 'execution_paused',
  //     question,
  //     conversationId: context.conversationId,
  //     pendingId,
  //     saveAs: node.data.saveAs
  //   };
  // }



  /**
 * Enhanced executeUserReply method with WhatsApp Interactive Message support
 */
private async executeUserReply(node: any, context: ExecutionContext) {
  const question = this.replaceVariables(node.data.question || '', context.variables);
  const buttons = node.data.buttons || [];
  
  console.log(`Asking question to conversation ${context.conversationId}: "${question}"`);
  console.log('Question buttons:', buttons);
  
  // Get contact information
  const getContact = await db.query.contacts.findFirst({
    where: eq(contacts?.id, context.contactId),
  });

  if (!getContact?.phone) {
    throw new Error('Contact phone number not found');
  }

  // Send the question with buttons (if any)
  if (buttons.length > 0) {
    // Send interactive message with buttons
    await this.sendInteractiveMessage(
      getContact.phone,
      question,
      buttons,
      getContact.channelId,
      context.conversationId
    );
  } else {
    // Send regular text message
    await sendBusinessMessage({
      to: getContact.phone,
      message: question,
      channelId: getContact.channelId,
      conversationId: context.conversationId,
    });
  }
  
  // Create a unique pending execution ID
  const pendingId = `${context.executionId}_${node.nodeId}_${Date.now()}`;
  
  // Store the execution state for resumption
  const pendingExecution: PendingExecution = {
    executionId: context.executionId,
    automationId: context.automationId,
    nodeId: node.nodeId,
    conversationId: context.conversationId,
    contactId: context.contactId,
    context: { ...context },
    saveAs: node.data.saveAs,
    timestamp: new Date(),
    status: 'waiting_for_response',
    expectedButtons: buttons // Store buttons for validation
  };
  
  this.pendingExecutions.set(pendingId, pendingExecution);
  
  // Update execution status to paused
  await db.update(automationExecutions)
    .set({
      status: 'paused',
      result: `Waiting for user response to: "${question}"`
    })
    .where(eq(automationExecutions.id, context.executionId));
  
  // Log that we're waiting
  await this.logNodeExecution(
    context.executionId,
    node.nodeId,
    node.type,
    'waiting_for_response',
    { ...node.data, question, buttons },
    { pendingId, action: 'interactive_question_sent' },
    null
  );
  
  console.log(`✅ Interactive question sent: ${question} with ${buttons.length} buttons`);
  console.log(`⏸️  Execution paused. Waiting for user response (pending ID: ${pendingId})`);
  
  return {
    action: 'execution_paused',
    question,
    buttons,
    conversationId: context.conversationId,
    pendingId,
    saveAs: node.data.saveAs
  };
}

/**
 * Send WhatsApp Interactive Message with Buttons
 */
private async sendInteractiveMessage(
  to: string, 
  question: string, 
  buttons: any[], 
  channelId: string, 
  conversationId?: string
) {
  try {
    // Get channel information
    const channel = await storage.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    // Create WhatsApp interactive message payload
    const interactivePayload = {
      messaging_product: "whatsapp",
      to: this.formatPhoneNumber(to),
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: question
        },
        action: {
          buttons: buttons.slice(0, 3).map((btn, index) => ({ // WhatsApp allows max 3 buttons
            type: "reply",
            reply: {
              id: btn.id || `btn_${index}`,
              title: btn.text?.substring(0, 20) || `Option ${index + 1}` // Max 20 chars
            }
          }))
        }
      }
    };

    // Send via WhatsApp API
    const whatsappApi = new WhatsAppApiService(channel);
    const result = await this.sendInteractiveMessageDirect(whatsappApi, interactivePayload);

    // Save the message to database
    const messageContent = `${question}\n\nOptions:\n${buttons.map((btn, i) => `${i + 1}. ${btn.text}`).join('\n')}`;
    
    // Find or create conversation
    let conversation = conversationId
      ? await storage.getConversation(conversationId)
      : await storage.getConversationByPhone(to);

    if (!conversation) {
      let contact = await storage.getContactByPhone(to);
      if (!contact) {
        contact = await storage.createContact({
          name: to,
          phone: to,
          channelId,
        });
      }

      conversation = await storage.createConversation({
        contactId: contact.id,
        contactPhone: to,
        contactName: contact.name || to,
        channelId,
        unreadCount: 0,
      });
    }

    // Save message
    const createdMessage = await storage.createMessage({
      conversationId: conversation.id,
      content: messageContent,
      sender: "business",
      status: "sent",
      whatsappMessageId: result.messages?.[0]?.id,
      messageType: "interactive",
      metadata: JSON.stringify({ buttons, interactiveType: "button" })
    });

    // Update conversation
    await storage.updateConversation(conversation.id, {
      lastMessageAt: new Date(),
      lastMessageText: question,
    });

    // Broadcast to websocket
    if ((global as any).broadcastToConversation) {
      (global as any).broadcastToConversation(conversation.id, {
        type: "new-message",
        message: createdMessage,
      });
    }

    console.log(`✅ Interactive message sent successfully to ${to}`);
    return result;

  } catch (error) {
    console.error('Error sending interactive message:', error);
    
    // Fallback to regular text message with numbered options
    console.log('📱 Falling back to text message with options...');
    const fallbackMessage = `${question}\n\nReply with:\n${buttons.map((btn, i) => `${i + 1}. ${btn.text}`).join('\n')}`;
    
    return await sendBusinessMessage({
      to,
      message: fallbackMessage,
      channelId,
      conversationId
    });
  }
}

/**
 * Send interactive message directly via WhatsApp API
 */
private async sendInteractiveMessageDirect(whatsappApi: any, payload: any) {
  const response = await fetch(
    `https://graph.facebook.com/v23.0/${whatsappApi.channel.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappApi.channel.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('WhatsApp API Error:', error);
    throw new Error(error.error?.message || 'Failed to send interactive message');
  }

  return await response.json();
}

/**
 * Enhanced handleUserResponse to handle button responses
 */
async handleUserResponse(conversationId: string, userResponse: string, interactiveData?: any) {
  console.log(`📨 Received user response for conversation ${conversationId}: "${userResponse}"`);
  
  // Find pending execution for this conversation
  const pendingExecution = this.findPendingExecutionByConversation(conversationId);
  if (!pendingExecution) {
    console.warn(`No pending execution found for conversation ${conversationId}`);
    return null;
  }

  try {
    // Remove from pending
    this.pendingExecutions.delete(pendingExecution.pendingId);
    
    // Process the response
    let processedResponse = userResponse;
    let selectedButtonId = null;
    
    // If this was a button click response
    if (interactiveData && interactiveData.type === 'button_reply') {
      selectedButtonId = interactiveData.button_reply.id;
      processedResponse = interactiveData.button_reply.title;
      console.log(`🔘 Button clicked: ${selectedButtonId} - "${processedResponse}"`);
    } else if (pendingExecution.expectedButtons && pendingExecution.expectedButtons.length > 0) {
      // Try to match text response to button options
      const matchedButton = this.matchTextToButton(userResponse, pendingExecution.expectedButtons);
      if (matchedButton) {
        selectedButtonId = matchedButton.id;
        processedResponse = matchedButton.text;
        console.log(`🎯 Matched text "${userResponse}" to button: ${selectedButtonId} - "${processedResponse}"`);
      }
    }
    
    // Update context with user response
    const context = pendingExecution.context;
    if (pendingExecution.saveAs) {
      context.variables[pendingExecution.saveAs] = processedResponse;
      
      // Also save button ID if available
      if (selectedButtonId) {
        context.variables[`${pendingExecution.saveAs}_button_id`] = selectedButtonId;
      }
      
      console.log(`💾 Saved user response to variable: ${pendingExecution.saveAs} = "${processedResponse}"`);
    }

    // Log the response received
    await this.logNodeExecution(
      context.executionId,
      pendingExecution.nodeId,
      'user_reply',
      'completed',
      { question: 'User response received', interactiveData },
      { 
        userResponse: processedResponse, 
        selectedButtonId,
        savedAs: pendingExecution.saveAs 
      },
      null
    );

    // Resume execution status
    await db.update(automationExecutions)
      .set({
        status: 'running',
        result: null
      })
      .where(eq(automationExecutions.id, context.executionId));

    console.log(`▶️  Resuming execution ${context.executionId} with user response`);

    // Get fresh automation data and continue
    const automation = await this.getAutomationWithFlow(context.automationId);
    if (!automation) {
      throw new Error(`Automation ${context.automationId} not found during resume`);
    }

    const currentNode = automation.nodes.find((n: any) => n.nodeId === pendingExecution.nodeId);
    if (currentNode) {
      await this.continueToNextNode(currentNode, automation, context);
    } else {
      throw new Error(`Node ${pendingExecution.nodeId} not found during resume`);
    }

    return {
      success: true,
      executionId: context.executionId,
      userResponse: processedResponse,
      selectedButtonId,
      savedVariable: pendingExecution.saveAs,
      resumedAt: new Date()
    };

  } catch (error) {
    console.error(`Error resuming execution for conversation ${conversationId}:`, error);
    
    await this.completeExecution(
      pendingExecution.executionId, 
      'failed', 
      `Failed to resume after user response: ${error.message}`
    );
    
    throw error;
  }
}

/**
 * Match text response to button options
 */
private matchTextToButton(text: string, buttons: any[]) {
  const lowerText = text.toLowerCase().trim();
  
  // Direct text match
  let match = buttons.find(btn => btn.text.toLowerCase() === lowerText);
  if (match) return match;
  
  // Check if it's a number (1, 2, 3...)
  const numberMatch = lowerText.match(/^(\d+)$/);
  if (numberMatch) {
    const index = parseInt(numberMatch[1]) - 1;
    if (index >= 0 && index < buttons.length) {
      return buttons[index];
    }
  }
  
  // Partial text match
  match = buttons.find(btn => 
    btn.text.toLowerCase().includes(lowerText) || 
    lowerText.includes(btn.text.toLowerCase())
  );
  
  return match;
}

/**
 * Format phone number for WhatsApp
 */
private formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if missing (assuming +1 for US/CA, adjust as needed)
  if (cleaned.length === 10) {
    return `1${cleaned}`;
  }
  
  return cleaned;
}
  


    /**
   * Handle user response and resume execution - NEW METHOD
   */
  // async handleUserResponse(conversationId: string, userResponse: string) {
  //   console.log(`📨 Received user response for conversation ${conversationId}: "${userResponse}"`);
    
  //   // Find pending execution for this conversation
  //   const pendingExecution = this.findPendingExecutionByConversation(conversationId);
  //   if (!pendingExecution) {
  //     console.warn(`No pending execution found for conversation ${conversationId}`);
  //     return null;
  //   }

  //   try {
  //     // Remove from pending
  //     this.pendingExecutions.delete(pendingExecution.pendingId);
      
  //     // Update context with user response
  //     const context = pendingExecution.context;
  //     if (pendingExecution.saveAs) {
  //       context.variables[pendingExecution.saveAs] = userResponse;
  //       console.log(`💾 Saved user response to variable: ${pendingExecution.saveAs} = "${userResponse}"`);
  //     }

  //     // Log the response received
  //     await this.logNodeExecution(
  //       context.executionId,
  //       pendingExecution.nodeId,
  //       'user_reply',
  //       'completed',
  //       { question: 'User response received' },
  //       { userResponse, savedAs: pendingExecution.saveAs },
  //       null
  //     );

  //     // Resume execution status
  //     await db.update(automationExecutions)
  //       .set({
  //         status: 'running',
  //         result: null
  //       })
  //       .where(eq(automationExecutions.id, context.executionId));

  //     console.log(`▶️  Resuming execution ${context.executionId} with user response`);

  //     // Get fresh automation data
  //     const automation = await this.getAutomationWithFlow(context.automationId);
  //     if (!automation) {
  //       throw new Error(`Automation ${context.automationId} not found during resume`);
  //     }

  //     // Find the current node and continue to next
  //     const currentNode = automation.nodes.find((n: any) => n.nodeId === pendingExecution.nodeId);
  //     if (currentNode) {
  //       await this.continueToNextNode(currentNode, automation, context);
  //     } else {
  //       throw new Error(`Node ${pendingExecution.nodeId} not found during resume`);
  //     }

  //     return {
  //       success: true,
  //       executionId: context.executionId,
  //       userResponse,
  //       savedVariable: pendingExecution.saveAs,
  //       resumedAt: new Date()
  //     };

  //   } catch (error) {
  //     console.error(`Error resuming execution for conversation ${conversationId}:`, error);
      
  //     // Fail the execution
  //     await this.completeExecution(
  //       pendingExecution.executionId, 
  //       'failed', 
  //       `Failed to resume after user response: ${error.message}`
  //     );
      
  //     throw error;
  //   }
  // }

  /**
   * Find pending execution by conversation ID
   */
  private findPendingExecutionByConversation(conversationId: string) {
    for (const [pendingId, execution] of this.pendingExecutions) {
      if (execution.conversationId === conversationId) {
        return { pendingId, ...execution };
      }
    }
    return null;
  }

  /**
   * Execute time gap node
   */
  private async executeTimeGap(node: any, context: ExecutionContext, automation?: any) {
    const delay = node.data?.delay || 60;
    console.log(`⏳ Delaying execution by ${delay} seconds`);
    
    // Schedule continuation after delay
    setTimeout(async () => {
      try {
        console.log(`⏰ Delay completed, continuing execution`);
        
        // Get fresh automation data
        const freshAutomation = await this.getAutomationWithFlow(context.automationId);
        await this.continueToNextNode(node, freshAutomation, context);
      } catch (error) {
        console.error('Error continuing after delay:', error);
        await this.completeExecution(context.executionId, 'failed', `Delay continuation failed: ${error.message}`);
      }
    }, delay * 1000);

    return {
      action: 'delay_started',
      delay,
      scheduledFor: new Date(Date.now() + delay * 1000)
    };
  }

  /**
   * Execute send template node
   */
  private async executeSendTemplate(node: any, context: ExecutionContext) {
    const templateId = node.data?.templateId;
    console.log("node & context", node, context);
    
    if (!templateId) {
      throw new Error('No template ID provided');
    }

    const getContact = await db.query.contacts.findFirst({
      where: eq(contacts?.id, context.contactId),
    });
  
    if (!getContact?.phone) {
      throw new Error('Contact phone number not found');
    }
    
    console.log(`📄 Sending template ${templateId} to conversation ${context.conversationId}`);
    if (getContact?.phone) {
      await sendBusinessMessage({
        to: getContact?.phone,
        templateName: templateId,
        parameters: node.data?.parameters || [],
        channelId: getContact?.channelId,
      });
    }
    
    console.log(`✅ Template sent: ${templateId}`);
    
    return {
      action: 'template_sent',
      templateId,
      conversationId: context.conversationId
    };
  }

  /**
   * Execute assign user node
   */
  private async executeAssignUser(node: any, context: ExecutionContext) {
    const assigneeId = node.data?.assigneeId;
    
    if (!assigneeId) {
      throw new Error('No assignee ID provided');
    }
    
    console.log(`👤 Assigning conversation ${context.conversationId} to user ${assigneeId}`);
    
    // TODO: Update conversation assignment
    // if (context.conversationId) {
    //   await db.update(conversations)
    //     .set({ assignedTo: assigneeId })
    //     .where(eq(conversations.id, context.conversationId));
    // }
    
    console.log(`✅ Conversation assigned to: ${assigneeId}`);
    
    return {
      action: 'user_assigned',
      assigneeId,
      conversationId: context.conversationId
    };
  }


  /**
   * Get pending executions for monitoring
   */
  getPendingExecutions() {
    return Array.from(this.pendingExecutions.entries()).map(([pendingId, execution]) => ({
      pendingId,
      executionId: execution.executionId,
      conversationId: execution.conversationId,
      nodeId: execution.nodeId,
      contactId: execution.contactId,
      saveAs: execution.saveAs,
      timestamp: execution.timestamp,
      waitingTime: Date.now() - execution.timestamp.getTime()
    }));
  }

  /**
   * Check if conversation has pending execution
   */
  hasPendingExecution(conversationId: string): boolean {
    return this.findPendingExecutionByConversation(conversationId) !== null;
  }

  /**
   * Clean up expired pending executions (call this periodically)
   */
  async cleanupExpiredExecutions(timeoutMs: number = 30 * 60 * 1000) { // 30 minutes default
    const now = Date.now();
    const expired = [];
    
    for (const [pendingId, execution] of this.pendingExecutions) {
      if (now - execution.timestamp.getTime() > timeoutMs) {
        expired.push({ pendingId, execution });
      }
    }
    
    for (const { pendingId, execution } of expired) {
      this.pendingExecutions.delete(pendingId);
      
      // Mark execution as failed due to timeout
      await this.completeExecution(
        execution.executionId,
        'failed',
        'Execution timed out waiting for user response'
      );
      
      console.warn(`⚠️  Cleaned up expired execution: ${pendingId} (conversation: ${execution.conversationId})`);
    }
    
    return expired.length;
  }

  /**
   * Cancel pending execution
   */
  async cancelExecution(conversationId: string): Promise<boolean> {
    const pending = this.findPendingExecutionByConversation(conversationId);
    if (pending) {
      this.pendingExecutions.delete(pending.pendingId);
      await this.completeExecution(pending.executionId, 'failed', 'Execution cancelled by user');
      console.log(`❌ Cancelled execution for conversation: ${conversationId}`);
      return true;
    }
    return false;
  }

  /**
   * Complete execution
   */
  private async completeExecution(executionId: string, status: 'completed' | 'failed', result: string) {
    await db.update(automationExecutions)
      .set({
        status,
        completedAt: new Date(),
        result
      })
      .where(eq(automationExecutions.id, executionId));

    console.log(`🏁 Execution ${executionId} ${status}: ${result}`);
  }

  /**
   * Log node execution
   */
  private async logNodeExecution(
    executionId: string,
    nodeId: string,
    nodeType: string,
    status: string,
    input: any,
    output: any,
    error: string | null
  ) {
    await db.insert(automationExecutionLogs).values({
      executionId,
      nodeId,
      nodeType,
      status,
      input: JSON.stringify(input),
      output: JSON.stringify(output),
      error
    });
  }

  /**
   * Replace variables in text
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Get automation with nodes and edges
   */
  private async getAutomationWithFlow(automationId: string) {
    // Get automation
    const automation = await db.query.automations.findFirst({
      where: eq(automations.id, automationId),
      with: {
        nodes: true,
        edges: true,
      },
    });
  
    return automation;
  }
}







// Trigger Manager - handles when automations should start
export class AutomationTriggerService {
  private executionService: AutomationExecutionService;

  constructor() {
    this.executionService = new AutomationExecutionService();
  }

  /**
   * Handle new conversation trigger
   */
  async handleNewConversation(conversationId: string, channelId: string, contactId?: string) {
    console.log(`🎯 New conversation trigger: ${conversationId}`);
    
    // Find active automations with "new_conversation" trigger
    const activeAutomations = await db.select()
      .from(automations)
      .where(and(
        eq(automations.channelId, channelId),
        eq(automations.trigger, 'new_conversation'),
        eq(automations.status, 'active')
      ));

    console.log(`Found ${activeAutomations.length} active automation(s)`);

    // Start execution for each automation
    for (const automation of activeAutomations) {
      try {
        // Create execution record
        const [execution] = await db.insert(automationExecutions).values({
          automationId: automation.id,
          contactId,
          conversationId,
          triggerData: {
            trigger: 'new_conversation',
            channelId,
            timestamp: new Date()
          },
          status: 'running'
        }).returning();

        // Start execution
        await this.executionService.executeAutomation(execution.id);

      } catch (error) {
        console.error(`Failed to execute automation ${automation.id}:`, error);
      }
    }
  }

  /**
   * Handle message received trigger
   */
  async handleMessageReceived(conversationId: string, message: any, channelId: string, contactId?: string) {
    console.log(`💬 Message received trigger: ${conversationId}`);
    
    // First, check if this is a response to a pending user_reply node
    if (this.executionService.hasPendingExecution(conversationId)) {
      console.log(`📨 Processing as user response to pending execution`);
      try {
        await this.executionService.handleUserResponse(conversationId, message.content || message.text || message ,message.interactive);
        return; // Don't trigger new automations if this was a response
      } catch (error) {
        console.error(`Error handling user response:`, error);
        // Continue to trigger new automations as fallback
      }
    }
    
    // Normal message-based automation triggers
    const activeAutomations = await db.select()
      .from(automations)
      .where(and(
        eq(automations.channelId, channelId),
        eq(automations.trigger, 'message_received'),
        eq(automations.status, 'active')
      ));

    for (const automation of activeAutomations) {
      try {
        const [execution] = await db.insert(automationExecutions).values({
          automationId: automation.id,
          contactId,
          conversationId,
          triggerData: {
            trigger: 'message_received',
            message,
            channelId,
            timestamp: new Date()
          },
          status: 'running'
        }).returning();

        await this.executionService.executeAutomation(execution.id);
      } catch (error) {
        console.error(`Failed to execute automation ${automation.id}:`, error);
      }
    }
  }

    /**
   * Get execution service for external access
   */
    getExecutionService() {
      return this.executionService;
    }
}

// Export singleton instances
export const executionService = new AutomationExecutionService();
export const triggerService = new AutomationTriggerService();


// Periodic cleanup (run this somewhere in your app)
setInterval(() => {
  executionService.cleanupExpiredExecutions();
}, 5 * 60 * 1000); // Every 5 minutes