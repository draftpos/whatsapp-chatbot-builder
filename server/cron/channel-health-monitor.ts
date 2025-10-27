import * as cron from 'node-cron';
import { DatabaseStorage } from '../database-storage';
import { WhatsAppApiService } from '../services/whatsapp-api';

const storage = new DatabaseStorage();

export class ChannelHealthMonitor {
  private static instance: ChannelHealthMonitor;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {}

  static getInstance(): ChannelHealthMonitor {
    if (!ChannelHealthMonitor.instance) {
      ChannelHealthMonitor.instance = new ChannelHealthMonitor();
    }
    return ChannelHealthMonitor.instance;
  }

  // Check all channels health status
  async checkAllChannelsHealth() {
    console.log('[Channel Health Monitor] Starting health check for all channels...');
    
    try {
      const channels = await storage.getChannels();
      
      for (const channel of channels) {
        await this.checkChannelHealth(channel.id);
      }
      
      console.log('[Channel Health Monitor] Health check completed for all channels');
    } catch (error) {
      console.error('[Channel Health Monitor] Error checking channels health:', error);
    }
  }

  // Check individual channel health
  async checkChannelHealth(channelId: string) {
    try {
      const channel = await storage.getChannel(channelId);
      if (!channel) {
        console.error(`[Channel Health Monitor] Channel ${channelId} not found`);
        return;
      }

      console.log(`[Channel Health Monitor] Checking health for channel: ${channel.name} (${channel.phoneNumber})`);

      const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
      // Request only confirmed fields for WhatsAppBusinessPhoneNumber
      const fields = 'id,account_mode,display_phone_number,is_official_business_account,is_pin_enabled,is_preverified_number,messaging_limit_tier,name_status,new_name_status,platform_type,quality_rating,quality_score,search_visibility,status,throughput,verified_name,code_verification_status,certificate';
      const url = `https://graph.facebook.com/${apiVersion}/${channel.phoneNumberId}?fields=${fields}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${channel.accessToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        const healthDetails = {
          status: data.account_mode || 'UNKNOWN',
          name_status: data.name_status || 'UNKNOWN',
          phone_number: data.display_phone_number || channel.phoneNumber,
          quality_rating: data.quality_rating || 'UNKNOWN',
          throughput_level: data.throughput?.level || 'STANDARD',
          verification_status: data.verified_name?.status || 'NOT_VERIFIED',
          messaging_limit: data.messaging_limit_tier || 'UNKNOWN'
        };

        const previousStatus = channel.healthStatus;
        const newStatus = data.account_mode === 'CONNECTED' ? 'healthy' : 'warning';

        await storage.updateChannel(channelId, {
          healthStatus: newStatus,
          lastHealthCheck: new Date(),
          healthDetails
        });

        // Notify if status changed from healthy to unhealthy
        if (previousStatus === 'healthy' && newStatus !== 'healthy') {
          await this.notifyChannelIssue(channel, healthDetails);
        }

        console.log(`[Channel Health Monitor] Channel ${channel.name} status: ${newStatus}`);
      } else {
        const errorMessage = data.error?.message || 'Unknown error';
        
        await storage.updateChannel(channelId, {
          healthStatus: 'error',
          lastHealthCheck: new Date(),
          healthDetails: { 
            error: errorMessage,
            error_code: data.error?.code,
            error_type: data.error?.type
          }
        });

        // Always notify on errors
        await this.notifyChannelError(channel, errorMessage);
        
        console.error(`[Channel Health Monitor] Channel ${channel.name} error: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error(`[Channel Health Monitor] Error checking channel ${channelId}:`, error);
      
      await storage.updateChannel(channelId, {
        healthStatus: 'error',
        lastHealthCheck: new Date(),
        healthDetails: { 
          error: 'Network or system error',
          details: error.message
        }
      });
    }
  }

  // Notify about channel issues
  private async notifyChannelIssue(channel: any, details: any) {
    // Log the issue (in production, this could send email/SMS/webhook notification)
    console.warn(`[Channel Health Monitor] ISSUE DETECTED for ${channel.name}:`, {
      phoneNumber: channel.phoneNumber,
      status: details.status,
      quality_rating: details.quality_rating,
      messaging_limit: details.messaging_limit
    });

    // Store notification in database for UI display
    await storage.createApiLog({
      channelId: channel.id,
      requestType: 'health_check',
      endpoint: 'HEALTH_CHECK',
      method: 'GET',
      responseStatus: 200,
      responseBody: details,
      duration: 0
    });
  }

  // Notify about channel errors
  private async notifyChannelError(channel: any, errorMessage: string) {
    // Log the error (in production, this could send email/SMS/webhook notification)
    console.error(`[Channel Health Monitor] ERROR for ${channel.name}:`, {
      phoneNumber: channel.phoneNumber,
      error: errorMessage
    });

    // Store error notification in database for UI display
    await storage.createApiLog({
      channelId: channel.id,
      requestType: 'health_check',
      endpoint: 'HEALTH_CHECK',
      method: 'GET',
      responseStatus: 500,
      responseBody: { error: errorMessage },
      duration: 0
    });
  }

  // Start the cron job
  start() {
    // Run every 24 hours at 2 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      await this.checkAllChannelsHealth();
    });

    // Also run immediately on start
    this.checkAllChannelsHealth();

    console.log('[Channel Health Monitor] Started - will run daily at 2 AM');
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[Channel Health Monitor] Stopped');
    }
  }

  // Run health check manually
  async runManualCheck() {
    await this.checkAllChannelsHealth();
  }
}

// Export singleton instance
export const channelHealthMonitor = ChannelHealthMonitor.getInstance();