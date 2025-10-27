import { IStorage } from "./storage";
import { UserRepository } from "./repositories/user.repository";
import { ContactRepository } from "./repositories/contact.repository";
import { CampaignRepository } from "./repositories/campaign.repository";
import { ChannelRepository } from "./repositories/channel.repository";
import { TemplateRepository } from "./repositories/template.repository";
import { ConversationRepository } from "./repositories/conversation.repository";
import { MessageRepository } from "./repositories/message.repository";
import { AutomationRepository } from "./repositories/automation.repository";
import { AnalyticsRepository } from "./repositories/analytics.repository";
import { WebhookConfigRepository } from "./repositories/webhook-config.repository";
import { MessageQueueRepository } from "./repositories/message-queue.repository";
import { ApiLogRepository } from "./repositories/api-log.repository";
import { WhatsappChannelRepository } from "./repositories/whatsapp-channel.repository";

import type {
  User,
  InsertUser,
  Contact,
  InsertContact,
  Campaign,
  InsertCampaign,
  Channel,
  InsertChannel,
  Template,
  InsertTemplate,
  Conversation,
  InsertConversation,
  Message,
  InsertMessage,
  Automation,
  InsertAutomation,
  Analytics,
  InsertAnalytics,
  WhatsappChannel,
  InsertWhatsappChannel,
  WebhookConfig,
  InsertWebhookConfig,
  MessageQueue,
  InsertMessageQueue,
  ApiLog,
  InsertApiLog,
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private userRepo = new UserRepository();
  private contactRepo = new ContactRepository();
  private campaignRepo = new CampaignRepository();
  private channelRepo = new ChannelRepository();
  private templateRepo = new TemplateRepository();
  private conversationRepo = new ConversationRepository();
  private messageRepo = new MessageRepository();
  private automationRepo = new AutomationRepository();
  private analyticsRepo = new AnalyticsRepository();
  private webhookConfigRepo = new WebhookConfigRepository();
  private messageQueueRepo = new MessageQueueRepository();
  private apiLogRepo = new ApiLogRepository();
  private whatsappChannelRepo = new WhatsappChannelRepository();


  // Returns statistics of message queue
async getMessageQueueStats(): Promise<Record<string, number>> {
  return { queued: 0, processing: 0, sent: 0, delivered: 0, failed: 0 };
}

// Returns queued messages
async getQueuedMessages(limit: number = 10): Promise<MessageQueue[]> {
  return [];
}

// Returns message queue object (stub)
async getMessageQueue(): Promise<MessageQueue> {
  return {} as MessageQueue;
}

// Logs API request
async logApiRequest(log: InsertApiLog): Promise<ApiLog | null> {
  return null;
}

 async getAutomationByChannel(channelId: string): Promise<{ id: string; name: string; createdAt: Date | null; updatedAt: Date | null; channelId: string | null; description: string | null; trigger: string; triggerConfig: unknown; status: string | null; executionCount: number | null; lastExecutedAt: Date | null; createdBy: string | null; }[]> {
    // implement your logic
    return [];
}


  async getWhatsappChannels(): Promise<WhatsappChannel[]> {
    // implement your logic
    return [];
  }

  async deleteWhatsappChannel(id: string): Promise<void> {
    await this.whatsappChannelRepo.delete(id);
  }
  

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.userRepo.getById(id);
  }

  async getPermissions(id: string): Promise<string[] | undefined> {
    return this.userRepo.getByPermissions(id); // this now makes sense
  }
  

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userRepo.getByUsername(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return this.userRepo.create(insertUser);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.getAll();
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return this.contactRepo.getAll();
  }

  async getContactsByChannel(channelId: string): Promise<Contact[]> {
    return this.contactRepo.getByChannel(channelId);
  }
  async searchContactsByChannel(channelId: string): Promise<Contact[]> {
    return this.contactRepo.getByChannel(channelId);
  }


  async getContact(id: string): Promise<Contact | undefined> {
    return this.contactRepo.getById(id);
  }

  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    return this.contactRepo.getByPhone(phone);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    return this.contactRepo.create(insertContact);
  }

  async updateContact(
    id: string,
    contact: Partial<Contact>
  ): Promise<Contact | undefined> {
    return this.contactRepo.update(id, contact);
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contactRepo.delete(id);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    return this.contactRepo.search(query);
  }

  async createBulkContacts(
    insertContacts: InsertContact[]
  ): Promise<Contact[]> {
    return this.contactRepo.createBulk(insertContacts);
  }

  async checkExistingPhones(
    phones: string[],
    channelId: string
  ): Promise<string[]> {
    return this.contactRepo.checkExistingPhones(phones, channelId);
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return this.campaignRepo.getAll();
  }

  async getCampaignsByChannel(channelId: string): Promise<Campaign[]> {
    return this.campaignRepo.getByChannel(channelId);
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaignRepo.getById(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    return this.campaignRepo.create(insertCampaign);
  }

  async updateCampaign(
    id: string,
    campaign: Partial<Campaign>
  ): Promise<Campaign | undefined> {
    return this.campaignRepo.update(id, campaign);
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return this.campaignRepo.delete(id);
  }

  // Channels
  async getChannels(): Promise<Channel[]> {
    return this.channelRepo.getAll();
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return this.channelRepo.getById(id);
  }

  async getChannelByPhoneNumberId(
    phoneNumberId: string
  ): Promise<Channel | undefined> {
    return this.channelRepo.getByPhoneNumberId(phoneNumberId);
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    return this.channelRepo.create(insertChannel);
  }

  async updateChannel(
    id: string,
    channel: Partial<Channel>
  ): Promise<Channel | undefined> {
    return this.channelRepo.update(id, channel);
  }

  async deleteChannel(id: string): Promise<boolean> {
    return this.channelRepo.delete(id);
  }

  async getActiveChannel(): Promise<Channel | undefined> {
    return this.channelRepo.getActive();
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return this.templateRepo.getAll();
  }

  async getTemplatesByChannel(channelId: string): Promise<Template[]> {
    return this.templateRepo.getByChannel(channelId);
  }

  async getTemplatesByName(name: string): Promise<Template[]> {
    const templates = await this.templateRepo.getByName(name);
  
    // if undefined, default to empty array
    return templates ? (Array.isArray(templates) ? templates : [templates]) : [];
  }
  

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templateRepo.getById(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    return this.templateRepo.create(insertTemplate);
  }

  async updateTemplate(
    id: string,
    template: Partial<Template>
  ): Promise<Template | undefined> {
    return this.templateRepo.update(id, template);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templateRepo.delete(id);
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return this.conversationRepo.getAll();
  }

  async getConversationsByChannel(channelId: string): Promise<Conversation[]> {
    return this.conversationRepo.getByChannel(channelId);
  }

  async getConversationsNew(): Promise<Conversation[]> {
    return this.conversationRepo.getAllNew();
  }

  async getConversationsByChannelNew(
    channelId: string
  ): Promise<Conversation[]> {
    return this.conversationRepo.getByChannelNew(channelId);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversationRepo.getById(id);
  }


  async getConversationByPhone(
    phone: string
  ): Promise<Conversation | undefined> {
    return this.conversationRepo.getByPhone(phone);
  }

  async createConversation(
    insertConversation: InsertConversation
  ): Promise<Conversation> {
    return this.conversationRepo.create(insertConversation);
  }

  async updateConversation(
    id: string,
    conversation: Partial<Conversation>
  ): Promise<Conversation | undefined> {
    return this.conversationRepo.update(id, conversation);
  }

  async deleteConversation(id: string): Promise<boolean> {
    return this.conversationRepo.delete(id);
  }

  async getUnreadConversationsCount(): Promise<number> {
    return this.conversationRepo.getUnreadCount();
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messageRepo.getByConversation(conversationId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    return this.messageRepo.create(insertMessage);
  }

  async updateMessage(
    id: string,
    message: Partial<Message>
  ): Promise<Message | undefined> {
    return this.messageRepo.update(id, message);
  }

  async getMessageByWhatsAppId(
    whatsappMessageId: string
  ): Promise<Message | undefined> {
    return this.messageRepo.getByWhatsAppId(whatsappMessageId);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messageRepo.getById(id);
  }

  // Automations
  async getAutomations(): Promise<Automation[]> {
    // Get all automations by not filtering by channel
    return this.automationRepo.findByChannel("");
  }

  async getAutomationsByChannel(channelId: string): Promise<Automation[]> {
    return this.automationRepo.findByChannel(channelId);
  }

  async getAutomation(id: string): Promise<Automation | undefined> {
    return this.automationRepo.findById(id);
  }

  async createAutomation(
    insertAutomation: InsertAutomation
  ): Promise<Automation> {
    return this.automationRepo.create(insertAutomation);
  }

  async updateAutomation(
    id: string,
    automation: Partial<InsertAutomation>
  ): Promise<Automation | undefined> {
    const result = await this.automationRepo.update(id, automation);
    return result || undefined;
  }

  async deleteAutomation(id: string): Promise<boolean> {
    await this.automationRepo.delete(id);
    return true;
  }

  // Analytics
  // async getAnalytics(days?: number): Promise<Analytics[]> {
  //   return this.analyticsRepo.getAnalytics(days);
  // }

  async createOrUpdateAnalytics(
    insertAnalytics: InsertAnalytics
  ): Promise<Analytics> {
    return this.analyticsRepo.createOrUpdate(insertAnalytics);
  }

  async deleteOldAnalytics(daysToKeep: number): Promise<void> {
    return this.analyticsRepo.deleteOldAnalytics(daysToKeep);
  }

  // WhatsApp Channels
  async getWhatsappChannel(
    channelId: string
  ): Promise<WhatsappChannel | undefined> {
    return this.whatsappChannelRepo.getByChannelId(channelId);
  }

  async createWhatsappChannel(
    insertChannel: InsertWhatsappChannel
  ): Promise<WhatsappChannel> {
    return this.whatsappChannelRepo.create(insertChannel);
  }

  async updateWhatsappChannel(
    id: string,
    channel: Partial<WhatsappChannel>
  ): Promise<WhatsappChannel | undefined> {
    return this.whatsappChannelRepo.update(id, channel);
  }

  // Webhook Configs
  async getWebhookConfigs(): Promise<WebhookConfig[]> {
    return this.webhookConfigRepo.getAll();
  }

  async getWebhookConfig(id: string): Promise<WebhookConfig | undefined> {
    return this.webhookConfigRepo.getById(id);
  }

  async createWebhookConfig(
    insertConfig: InsertWebhookConfig
  ): Promise<WebhookConfig> {
    return this.webhookConfigRepo.create(insertConfig);
  }

  async updateWebhookConfig(
    id: string,
    config: Partial<WebhookConfig>
  ): Promise<WebhookConfig | undefined> {
    return this.webhookConfigRepo.update(id, config);
  }

  async deleteWebhookConfig(id: string): Promise<boolean> {
    return this.webhookConfigRepo.delete(id);
  }

  // Message Queue
  async getMessageQueueByChannel(channelId: string): Promise<MessageQueue[]> {
    return this.messageQueueRepo.getByChannel(channelId);
  }

  async getPendingMessages(): Promise<MessageQueue[]> {
    return this.messageQueueRepo.getPending();
  }

  // async getMessagesToCheck(): Promise<MessageQueue[]> {
  //   return this.messageQueueRepo.getMessagesToCheck();
  // }

  async createMessageQueueItem(
    insertMessage: InsertMessageQueue
  ): Promise<MessageQueue> {
    return this.messageQueueRepo.create(insertMessage);
  }

  async createBulkMessageQueue(
    insertMessages: InsertMessageQueue[]
  ): Promise<MessageQueue[]> {
    return this.messageQueueRepo.createBulk(insertMessages);
  }

  async updateMessageQueueItem(
    id: string,
    message: Partial<MessageQueue>
  ): Promise<MessageQueue | undefined> {
    return this.messageQueueRepo.update(id, message);
  }

  async updateMessageQueueByWhatsAppId(
    whatsappMessageId: string,
    updates: Partial<MessageQueue>
  ): Promise<boolean> {
    return this.messageQueueRepo.updateByWhatsAppId(whatsappMessageId, updates);
  }

  async getMessageQueueByCampaign(campaignId: string): Promise<MessageQueue[]> {
    return this.messageQueueRepo.getByCampaign(campaignId);
  }

  // async getMessagesForRetry(limit: number = 100): Promise<MessageQueue[]> {
  //   return this.messageQueueRepo.getForRetry(limit);
  // }

  // API Logs
  async createApiLog(insertLog: InsertApiLog): Promise<ApiLog> {
    return this.apiLogRepo.create(insertLog);
  }
  async getApiLogs(channelId: string, limit: number): Promise<ApiLog[]> {
    return this.apiLogRepo.getByChannel(channelId, limit);
  }

  // Analytics
  async getAnalyticsByChannel(
    channelId: string,
    days?: number
  ): Promise<Analytics[]> {
    return this.analyticsRepo.getAnalyticsByChannel(channelId, days);
  }

  async getAnalytics(): Promise<Analytics[]> {
    return this.analyticsRepo.getAnalytics();
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    return this.analyticsRepo.createOrUpdate(insertAnalytics);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const { totalCount, todayCount, weekCount, lastWeekCount } =
      await this.contactRepo.getContactStats();
    const totalCampaigns = await this.campaignRepo
      .getAll()
      .then((c) => c.length);
    const totalTemplates = await this.templateRepo
      .getAll()
      .then((t) => t.length);
    const messageStats = await this.messageQueueRepo.getMessageStats();

    return {
      totalContacts: totalCount,
      todayContacts: todayCount,
      weekContacts: weekCount,
      lastWeekContacts: lastWeekCount,
      totalCampaigns,
      totalTemplates,
      ...messageStats,
    };
  }

  async getDashboardStatsByChannel(channelId: string): Promise<any> {
    const { totalCount, todayCount, weekCount, lastWeekCount } =
      await this.contactRepo.getContactStats(channelId);
    const totalCampaigns = await this.campaignRepo
      .getByChannel(channelId)
      .then((c) => c.length);
    const totalTemplates = await this.templateRepo
      .getByChannel(channelId)
      .then((t) => t.length);
    const messageStats = await this.messageQueueRepo.getMessageStatsByChannel(
      channelId
    );

    return {
      totalContacts: Number(totalCount),
      todayContacts: Number(todayCount),
      weekContacts: Number(weekCount),
      lastWeekContacts: Number(lastWeekCount),
      totalCampaigns,
      totalTemplates,
      ...messageStats,
    };
  }
}
