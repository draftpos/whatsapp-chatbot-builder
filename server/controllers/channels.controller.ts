import type { Request, Response } from 'express';
import { storage } from '../storage';
import { insertChannelSchema } from '@shared/schema';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import type { RequestWithChannel } from '../middlewares/channel.middleware';

export const getChannels = asyncHandler(async (req: Request, res: Response) => {
  const channels = await storage.getChannels();
  res.json(channels);
});

export const getActiveChannel = asyncHandler(async (req: Request, res: Response) => {
  const channel = await storage.getActiveChannel();
  if (!channel) {
    throw new AppError(404, 'No active channel found');
  }
  res.json(channel);
});

export const createChannel = asyncHandler(async (req: Request, res: Response) => {
  const validatedChannel = insertChannelSchema.parse(req.body);
  
  // If this is set as active, deactivate all other channels
  if (validatedChannel.isActive) {
    const channels = await storage.getChannels();
    for (const channel of channels) {
      if (channel.isActive) {
        await storage.updateChannel(channel.id, { isActive: false });
      }
    }
  }
  
  // Create the channel
  const channel = await storage.createChannel(validatedChannel);
  
  // Immediately check channel health after creation
  try {
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
      console.log('Channel health data:', JSON.stringify(data, null, 2));
      
      const healthDetails = {
        // Core fields
        status: data.account_mode || 'UNKNOWN',
        name_status: data.name_status || 'UNKNOWN',
        phone_number: data.display_phone_number || channel.phoneNumber,
        quality_rating: data.quality_rating || 'UNKNOWN',
        throughput_level: data.throughput?.level || 'STANDARD',
        verification_status: data.verified_name?.status || 'NOT_VERIFIED',
        messaging_limit: data.messaging_limit_tier || 'UNKNOWN',
        // Additional fields from Meta API
        platform_type: data.platform_type,
        is_official_business_account: data.is_official_business_account,
        quality_score: data.quality_score,
        is_preverified_number: data.is_preverified_number,
        search_visibility: data.search_visibility,
        is_pin_enabled: data.is_pin_enabled,
        code_verification_status: data.code_verification_status,
        certificate: data.certificate
      };

      await storage.updateChannel(channel.id, {
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        healthDetails
      });
    } else {
      await storage.updateChannel(channel.id, {
        healthStatus: 'error',
        lastHealthCheck: new Date(),
        healthDetails: { 
          error: data.error?.message || 'Unknown error',
          error_code: data.error?.code,
          error_type: data.error?.type
        }
      });
    }
  } catch (error) {
    console.error('Error checking channel health after creation:', error);
  }
  
  // Return the created channel with updated health status
  const updatedChannel = await storage.getChannel(channel.id);
  res.json(updatedChannel);
});

export const updateChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // If setting this channel as active, deactivate all others
  if (req.body.isActive === true) {
    const channels = await storage.getChannels();
    for (const channel of channels) {
      if (channel.id !== id && channel.isActive) {
        await storage.updateChannel(channel.id, { isActive: false });
      }
    }
  }
  
  const channel = await storage.updateChannel(id, req.body);
  if (!channel) {
    throw new AppError(404, 'Channel not found');
  }
  res.json(channel);
});

export const deleteChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const success = await storage.deleteChannel(id);
  if (!success) {
    throw new AppError(404, 'Channel not found');
  }
  res.status(204).send();
});

export const checkChannelHealth = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const channel = await storage.getChannel(id);
  if (!channel) {
    throw new AppError(404, 'Channel not found');
  }

  try {
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
      console.log('Channel health API response:', JSON.stringify(data, null, 2));
      
      const healthDetails = {
        status: data.account_mode || 'UNKNOWN',
        name_status: data.name_status || 'UNKNOWN',
        phone_number: data.display_phone_number || channel.phoneNumber,
        quality_rating: data.quality_rating || 'UNKNOWN',
        throughput_level: data.throughput?.level || 'STANDARD',
        verification_status: data.verified_name?.status || 'NOT_VERIFIED',
        messaging_limit: data.messaging_limit_tier || 'UNKNOWN',
        // Additional fields from Meta API
        platform_type: data.platform_type,
        is_official_business_account: data.is_official_business_account,
        quality_score: data.quality_score,
        is_preverified_number: data.is_preverified_number,
        search_visibility: data.search_visibility,
        is_pin_enabled: data.is_pin_enabled,
        code_verification_status: data.code_verification_status,
        certificate: data.certificate
      };

      await storage.updateChannel(id, {
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        healthDetails
      });

      res.json({
        status: 'healthy',
        details: healthDetails,
        lastCheck: new Date()
      });
    } else {
      await storage.updateChannel(id, {
        healthStatus: 'error',
        lastHealthCheck: new Date(),
        healthDetails: { error: data.error?.message || 'Unknown error' }
      });

      res.json({
        status: 'error',
        error: data.error?.message || 'Failed to fetch channel health',
        lastCheck: new Date()
      });
    }
  } catch (error) {
    await storage.updateChannel(id, {
      healthStatus: 'error',
      lastHealthCheck: new Date(),
      healthDetails: { error: 'Network error' }
    });

    res.json({
      status: 'error',
      error: 'Failed to check channel health',
      lastCheck: new Date()
    });
  }
});

export const checkAllChannelsHealth = asyncHandler(async (req: Request, res: Response) => {
  const { channelHealthMonitor } = await import('../cron/channel-health-monitor');
  await channelHealthMonitor.runManualCheck();
  res.json({
    message: 'Health check triggered for all channels',
    timestamp: new Date()
  });
});