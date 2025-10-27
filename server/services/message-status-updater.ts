import { db } from '../db';
import { messages } from '@shared/schema';
import { eq, and, or, isNull, gte, lte } from 'drizzle-orm';

export class MessageStatusUpdater {
  constructor() {}

  async updatePendingMessageStatuses() {
    try {
      // Get messages that need status updates (sent but not delivered/read/failed)
      const pendingMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            or(
              eq(messages.direction, 'outbound'),
              eq(messages.direction, 'outgoing')
            ),
            eq(messages.status, 'sent'),
            gte(messages.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
          )
        )
        .limit(50); // Process in batches

      console.log(`[MessageStatusUpdater] Found ${pendingMessages.length} messages to check`);

      for (const message of pendingMessages) {
        if (!message.whatsappMessageId) continue;

        // Simulate status updates based on message age
        const messageAge = Date.now() - new Date(message.createdAt!).getTime();
        const updates: any = {
          updatedAt: new Date()
        };

        // Simulate delivery after 5-10 seconds
        if (messageAge > 5000 && messageAge < 600000) { // Between 5 seconds and 10 minutes
          updates.status = 'delivered';
          updates.deliveredAt = new Date(new Date(message.createdAt!).getTime() + 5000);
          
          // Simulate read after 15-30 seconds (50% chance)
          if (messageAge > 15000 && Math.random() > 0.5) {
            updates.status = 'read';
            updates.readAt = new Date(new Date(message.createdAt!).getTime() + 15000);
          }
        } else if (messageAge > 600000) { // Older than 10 minutes
          // Mark as failed if still in sent status (30% chance)
          if (Math.random() > 0.7) {
            updates.status = 'failed';
            updates.errorCode = '131049';
            updates.errorMessage = 'This message was not delivered to maintain healthy ecosystem engagement.';
          } else {
            // Otherwise mark as delivered
            updates.status = 'delivered';
            updates.deliveredAt = new Date(new Date(message.createdAt!).getTime() + 5000);
          }
        }

        // Update the message if status changed
        if (updates.status && updates.status !== message.status) {
          await db
            .update(messages)
            .set(updates)
            .where(eq(messages.id, message.id));

          console.log(`[MessageStatusUpdater] Updated message ${message.id} to status: ${updates.status}`);
        }
      }



    } catch (error) {
      console.error('[MessageStatusUpdater] Error in updatePendingMessageStatuses:', error);
    }
  }

  // Start the cron job
  startCronJob(intervalSeconds: number = 30) {
    console.log(`[MessageStatusUpdater] Starting cron job with ${intervalSeconds}s interval`);
    
    // Run immediately on start
    this.updatePendingMessageStatuses();
    
    // Then run periodically
    setInterval(() => {
      this.updatePendingMessageStatuses();
    }, intervalSeconds * 1000);
  }
}