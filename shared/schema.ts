import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("admin"), // admin, manager, agent
  avatar: text("avatar"),
  status: text("status").notNull().default("active"), // active, inactive
  permissions: text("permissions").array().notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversation assignments to users
export const conversationAssignments = pgTable("conversation_assignments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").references(() => users.id, {
    onDelete: "cascade",
  }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: text("status").notNull().default("active"), // active, resolved, transferred
  priority: text("priority").default("normal"), // low, normal, high, urgent
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activity logs
export const userActivityLogs = pgTable("user_activity_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // login, logout, message_sent, conversation_assigned, etc.
  entityType: text("entity_type"), // conversation, message, contact, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details").default({}),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id").references(() => channels.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    groups: jsonb("groups").$type<string[]>().default([]),
    tags: jsonb("tags").default([]),
    status: text("status").default("active"), // active, blocked, unsubscribed
    lastContact: timestamp("last_contact"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    contactChannelIdx: index("contacts_channel_idx").on(table.channelId),
    contactPhoneIdx: index("contacts_phone_idx").on(table.phone),
    contactStatusIdx: index("contacts_status_idx").on(table.status),
    contactChannelPhoneUnique: unique("contacts_channel_phone_unique").on(
      table.channelId,
      table.phone
    ),
  })
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id").references(() => channels.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    campaignType: text("campaign_type").notNull(), // contacts, csv, api
    type: text("type").notNull(), // marketing, transactional
    apiType: text("api_type").notNull(), // cloud_api, mm_lite
    templateId: varchar("template_id").references(() => templates.id),
    templateName: text("template_name"),
    templateLanguage: text("template_language"),
    variableMapping: jsonb("variable_mapping").$type<Record<string, string>>().default({}), // Maps template variables to contact/csv fields
    contactGroups: jsonb("contact_groups").$type<string[]>().default([]), // For contacts campaign
    csvData: jsonb("csv_data").default([]), // For CSV campaign
    apiKey: varchar("api_key"), // For API campaign
    apiEndpoint: text("api_endpoint"), // For API campaign
    status: text("status").default("draft"), // draft, scheduled, active, paused, completed
    scheduledAt: timestamp("scheduled_at"),
    recipientCount: integer("recipient_count").default(0),
    sentCount: integer("sent_count").default(0),
    deliveredCount: integer("delivered_count").default(0),
    readCount: integer("read_count").default(0),
    repliedCount: integer("replied_count").default(0),
    failedCount: integer("failed_count").default(0),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    campaignChannelIdx: index("campaigns_channel_idx").on(table.channelId),
    campaignStatusIdx: index("campaigns_status_idx").on(table.status),
    campaignCreatedIdx: index("campaigns_created_idx").on(table.createdAt),
  })
);

// Campaign Recipients table for tracking individual recipient status
export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    campaignId: varchar("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    contactId: varchar("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    phone: text("phone").notNull(),
    name: text("name"),
    status: text("status").default("pending"), // pending, sent, delivered, read, failed
    whatsappMessageId: varchar("whatsapp_message_id"),
    templateParams: jsonb("template_params").default({}),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
    errorCode: varchar("error_code"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    recipientCampaignIdx: index("recipients_campaign_idx").on(table.campaignId),
    recipientStatusIdx: index("recipients_status_idx").on(table.status),
    recipientPhoneIdx: index("recipients_phone_idx").on(table.phone),
    campaignPhoneUnique: unique("campaign_phone_unique").on(
      table.campaignId,
      table.phone
    ),
  })
);

// WhatsApp Business Channels for multi-account support
export const channels = pgTable("channels", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phoneNumberId: text("phone_number_id").notNull(),
  accessToken: text("access_token").notNull(),
  whatsappBusinessAccountId: text("whatsapp_business_account_id"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true),
  // Health status fields
  healthStatus: text("health_status").default("unknown"), // healthy, warning, error, unknown
  lastHealthCheck: timestamp("last_health_check"),
  healthDetails: jsonb("health_details").default({}), // Detailed health information
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => channels.id),
  name: text("name").notNull(),
  category: text("category").notNull(), // marketing, transactional, authentication, utility
  language: text("language").default("en_US"),
  header: text("header"),
  body: text("body").notNull(),
  footer: text("footer"),
  buttons: jsonb("buttons").default([]),
  variables: jsonb("variables").default([]),
  status: text("status").default("draft"), // draft, pending, approved, rejected
  rejectionReason: text("rejection_reason"), // Reason for template rejection from WhatsApp
  // Media support fields
  mediaType: text("media_type").default("text"), // text, image, video, document, carousel
  mediaUrl: text("media_url"), // URL of uploaded media
  mediaHandle: text("media_handle"), // WhatsApp media handle after upload
  carouselCards: jsonb("carousel_cards").default([]), // For carousel templates
  whatsappTemplateId: text("whatsapp_template_id"), // ID from WhatsApp after creation
  usage_count: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id").references(() => channels.id, {
      onDelete: "cascade",
    }),
    contactId: varchar("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    assignedTo: varchar("assigned_to"),
    contactPhone: varchar("contact_phone"), // Store phone number for webhook lookups
    contactName: varchar("contact_name"), // Store contact name
    status: text("status").default("open"), // open, closed, assigned, pending
    priority: text("priority").default("normal"), // low, normal, high, urgent
    tags: jsonb("tags").default([]),
    unreadCount: integer("unread_count").default(0), // Track unread messages
    lastMessageAt: timestamp("last_message_at"),
    lastMessageText: text("last_message_text"), // Cache last message for display
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    conversationChannelIdx: index("conversations_channel_idx").on(
      table.channelId
    ),
    conversationContactIdx: index("conversations_contact_idx").on(
      table.contactId
    ),
    conversationPhoneIdx: index("conversations_phone_idx").on(
      table.contactPhone
    ),
    conversationStatusIdx: index("conversations_status_idx").on(table.status),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id").references(
      () => conversations.id,
      {
        onDelete: "cascade",
      }
    ),
    whatsappMessageId: varchar("whatsapp_message_id"), // Store WhatsApp message ID
    fromUser: boolean("from_user").default(false),
    direction: varchar("direction").default("outbound"), // inbound, outbound
    content: text("content").notNull(),
    type: text("type").default("text"), // text, image, document, template
    messageType: varchar("message_type"), // For WhatsApp message types
    mediaId: varchar("media_id"), // WhatsApp media ID
    mediaUrl: text("media_url"), // Download URL (fetched from Graph API)
    mediaMimeType: varchar("media_mime_type", { length: 100 }),
    mediaSha256: varchar("media_sha256", { length: 128 }),
    status: text("status").default("sent"), // sent, delivered, read, failed, received
    timestamp: timestamp("timestamp"), // WhatsApp timestamp
    metadata: jsonb("metadata").default({}), // Store additional WhatsApp data
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
    errorCode: varchar("error_code", { length: 50 }),
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"), // Store detailed error information from WhatsApp
    campaignId: varchar("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }), // Link to campaign if sent from campaign
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    messageConversationIdx: index("messages_conversation_idx").on(
      table.conversationId
    ),
    messageWhatsappIdx: index("messages_whatsapp_idx").on(
      table.whatsappMessageId
    ),
    messageDirectionIdx: index("messages_direction_idx").on(table.direction),
    messageStatusIdx: index("messages_status_idx").on(table.status),
    messageTimestampIdx: index("messages_timestamp_idx").on(table.timestamp),
    messageCreatedIdx: index("messages_created_idx").on(table.createdAt),
  })
);

// Automation workflows table
export const automations = pgTable(
  "automations",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id").references(() => channels.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    trigger: text("trigger").notNull(), // message_received, keyword, schedule, api_webhook
    triggerConfig: jsonb("trigger_config").default({}),
    status: text("status").default("inactive"), // active, inactive, paused
    executionCount: integer("execution_count").default(0),
    lastExecutedAt: timestamp("last_executed_at"),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    automationChannelIdx: index("automations_channel_idx").on(table.channelId),
    automationStatusIdx: index("automations_status_idx").on(table.status),
  })
);

// ─── Automation Nodes ─────────────────────────
export const automationNodes = pgTable(
  "automation_nodes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    automationId: varchar("automation_id")
      .notNull()
      .references(() => automations.id, { onDelete: "cascade" }),
    nodeId: varchar("node_id").notNull().unique(),
    type: text("type").notNull(), // trigger, action, condition, delay
    subtype: text("subtype"), // send_template, send_message, wait, etc.
    position: jsonb("position").default({}), // {x, y}
    measured: jsonb("measured").default({}), // {x, y}
    data: jsonb("data").default({}), // node config
    connections: jsonb("connections").default([]), // array of next nodeIds
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    nodeAutomationIdx: index("automation_nodes_automation_idx").on(
      table.automationId
    ),
    nodeUniqueIdx: unique("automation_nodes_unique_idx").on(
      table.automationId,
      table.nodeId
    ),
  })
);

// ─── Automation Edges ─────────────────────────
export const automationEdges = pgTable(
  "automation_edges",
  {
    id: varchar("id").primaryKey(), // This can use the edge ID from your JSON if needed

    automationId: varchar("automation_id")
      .notNull()
      .references(() => automations.id, { onDelete: "cascade" }),

    sourceNodeId: varchar("source_node_id")
      .notNull()
      .references(() => automationNodes.nodeId, { onDelete: "cascade" }),

    targetNodeId: varchar("target_node_id")
      .notNull()
      .references(() => automationNodes.nodeId, { onDelete: "cascade" }),

    animated: boolean("animated").default(false),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    automationEdgeIdx: index("automation_edges_automation_idx").on(
      table.automationId
    ),
    edgeUniqueIdx: unique("automation_edges_unique_idx").on(
      table.automationId,
      table.sourceNodeId,
      table.targetNodeId
    ),
  })
);

// ─── Automation Executions ────────────────────
export const automationExecutions = pgTable(
  "automation_executions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    automationId: varchar("automation_id")
      .notNull()
      .references(() => automations.id, { onDelete: "cascade" }),
    contactId: varchar("contact_id").references(() => contacts.id),
    conversationId: varchar("conversation_id").references(
      () => conversations.id
    ),
    triggerData: jsonb("trigger_data").default({}),
    status: text("status").notNull(), // running, completed, failed
    currentNodeId: varchar("current_node_id"),
    executionPath: jsonb("execution_path").default([]),
    variables: jsonb("variables").default({}),
    result: text("result"),
    error: text("error"),
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    executionAutomationIdx: index("automation_executions_automation_idx").on(
      table.automationId
    ),
    executionStatusIdx: index("automation_executions_status_idx").on(
      table.status
    ),
  })
);

// ─── Automation Execution Logs ────────────────
export const automationExecutionLogs = pgTable(
  "automation_execution_logs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    executionId: varchar("execution_id")
      .notNull()
      .references(() => automationExecutions.id, { onDelete: "cascade" }),
    nodeId: varchar("node_id").notNull(),
    nodeType: text("node_type").notNull(),
    status: text("status").notNull(), // started, completed, failed
    input: jsonb("input").default({}),
    output: jsonb("output").default({}),
    error: text("error"),
    executedAt: timestamp("executed_at").defaultNow(),
  },
  (table) => ({
    logExecutionIdx: index("automation_execution_logs_execution_idx").on(
      table.executionId
    ),
  })
);

export const analytics = pgTable("analytics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id"),
  date: timestamp("date").notNull(),
  messagesSent: integer("messages_sent").default(0),
  messagesDelivered: integer("messages_delivered").default(0),
  messagesRead: integer("messages_read").default(0),
  messagesReplied: integer("messages_replied").default(0),
  newContacts: integer("new_contacts").default(0),
  activeCampaigns: integer("active_campaigns").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// WhatsApp Channels table
export const whatsappChannels = pgTable("whatsapp_channels", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  phoneNumberId: varchar("phone_number_id", { length: 50 }).notNull(),
  wabaId: varchar("waba_id", { length: 50 }).notNull(),
  accessToken: text("access_token").notNull(), // Should be encrypted in production
  businessAccountId: varchar("business_account_id", { length: 50 }),
  rateLimitTier: varchar("rate_limit_tier", { length: 20 }).default("standard"),
  qualityRating: varchar("quality_rating", { length: 20 }).default("green"), // green, yellow, red
  status: varchar("status", { length: 20 }).default("inactive"), // active, inactive, error
  errorMessage: text("error_message"),
  lastHealthCheck: timestamp("last_health_check"),
  messageLimit: integer("message_limit"),
  messagesUsed: integer("messages_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook Configuration table
export const webhookConfigs = pgTable("webhook_configs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id"), // No foreign key - global webhook for all channels
  webhookUrl: text("webhook_url").notNull(),
  verifyToken: varchar("verify_token", { length: 100 }).notNull(),
  appSecret: text("app_secret"), // For signature verification
  events: jsonb("events").default([]).notNull(), // ['messages', 'message_status', 'message_template_status_update']
  isActive: boolean("is_active").default(true),
  lastPingAt: timestamp("last_ping_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message Queue table for campaign management
export const messageQueue = pgTable("message_queue", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  channelId: varchar("channel_id").references(() => whatsappChannels.id),
  recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
  templateName: varchar("template_name", { length: 100 }),
  templateParams: jsonb("template_params").default([]),
  messageType: varchar("message_type", { length: 20 }).notNull(), // marketing, utility, authentication
  status: varchar("status", { length: 20 }).default("queued"), // queued, processing, sent, delivered, failed
  attempts: integer("attempts").default(0),
  whatsappMessageId: varchar("whatsapp_message_id", { length: 100 }),
  conversationId: varchar("conversation_id", { length: 100 }),
  sentVia: varchar("sent_via", { length: 20 }), // cloud_api, marketing_messages
  cost: varchar("cost", { length: 20 }), // Store as string to avoid decimal precision issues
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  scheduledFor: timestamp("scheduled_for"),
  processedAt: timestamp("processed_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// API Request Logs for debugging
export const apiLogs = pgTable("api_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => channels.id),
  requestType: varchar("request_type", { length: 50 }).notNull(), // send_message, get_template, webhook_receive
  endpoint: text("endpoint").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  requestBody: jsonb("request_body"),
  responseStatus: integer("response_status"),
  responseBody: jsonb("response_body"),
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Panel configuration table for branding and settings

export const panelConfig = pgTable("panel_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  tagline: varchar("tagline"),
  description: text("description"),
  logo: varchar("logo"),
  favicon: varchar("favicon"),
  defaultLanguage: varchar("default_language", { length: 5 }).default("en"),
  supportedLanguages: jsonb("supported_languages").default(sql`'["en"]'`),
  companyName: varchar("company_name"),
  companyWebsite: varchar("company_website"),
  supportEmail: varchar("support_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Permissions type definition
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_EXPORT: "dashboard:export",

  // Contacts permissions
  CONTACTS_VIEW: "contacts:view",
  CONTACTS_CREATE: "contacts:create",
  CONTACTS_EDIT: "contacts:edit",
  CONTACTS_DELETE: "contacts:delete",
  CONTACTS_IMPORT: "contacts:import",
  CONTACTS_EXPORT: "contacts:export",

  // Campaigns permissions
  CAMPAIGNS_VIEW: "campaigns:view",
  CAMPAIGNS_CREATE: "campaigns:create",
  CAMPAIGNS_EDIT: "campaigns:edit",
  CAMPAIGNS_DELETE: "campaigns:delete",
  CAMPAIGNS_SEND: "campaigns:send",
  CAMPAIGNS_SCHEDULE: "campaigns:schedule",

  // Templates permissions
  TEMPLATES_VIEW: "templates:view",
  TEMPLATES_CREATE: "templates:create",
  TEMPLATES_EDIT: "templates:edit",
  TEMPLATES_DELETE: "templates:delete",
  TEMPLATES_SYNC: "templates:sync",

  // Inbox permissions
  INBOX_VIEW: "inbox:view",
  INBOX_SEND_MESSAGE: "inbox:send",
  INBOX_ASSIGN: "inbox:assign",
  INBOX_CLOSE: "inbox:close",
  INBOX_DELETE: "inbox:delete",

  // Analytics permissions
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",

  // Settings permissions
  SETTINGS_VIEW: "settings:view",
  SETTINGS_CHANNELS: "settings:channels",
  SETTINGS_WEBHOOK: "settings:webhook",
  SETTINGS_TEAM: "settings:team",
  SETTINGS_API: "settings:api",

  // Team management permissions
  TEAM_VIEW: "team:view",
  TEAM_CREATE: "team:create",
  TEAM_EDIT: "team:edit",
  TEAM_DELETE: "team:delete",
  TEAM_PERMISSIONS: "team:permissions",

  // Logs permissions
  LOGS_VIEW: "logs:view",

  // Automation permissions
  AUTOMATIONS_VIEW: "automations:view",
  AUTOMATIONS_CREATE: "automations:create",
  AUTOMATIONS_EDIT: "automations:edit",
  AUTOMATIONS_DELETE: "automations:delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type PermissionMap = Record<Permission, boolean>;

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS), // Admin has all permissions
  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EXPORT,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.CONTACTS_EXPORT,
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_EDIT,
    PERMISSIONS.CAMPAIGNS_SEND,
    PERMISSIONS.CAMPAIGNS_SCHEDULE,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.TEMPLATES_CREATE,
    PERMISSIONS.TEMPLATES_EDIT,
    PERMISSIONS.TEMPLATES_SYNC,
    PERMISSIONS.INBOX_VIEW,
    PERMISSIONS.INBOX_SEND_MESSAGE,
    PERMISSIONS.INBOX_ASSIGN,
    PERMISSIONS.INBOX_CLOSE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.TEAM_VIEW,
  ],
  agent: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.INBOX_VIEW,
    PERMISSIONS.INBOX_SEND_MESSAGE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});
export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertAutomationNodeSchema = createInsertSchema(
  automationNodes
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAutomationExecutionSchema = createInsertSchema(
  automationExecutions
).omit({ id: true, startedAt: true });
export const insertAutomationExecutionLogSchema = createInsertSchema(
  automationExecutionLogs
).omit({ id: true, executedAt: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});
export const insertWhatsappChannelSchema = createInsertSchema(
  whatsappChannels
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWebhookConfigSchema = createInsertSchema(
  webhookConfigs
).omit({ id: true, createdAt: true });
export const insertMessageQueueSchema = createInsertSchema(messageQueue).omit({
  id: true,
  createdAt: true,
});
export const insertApiLogSchema = createInsertSchema(apiLogs).omit({
  id: true,
  createdAt: true,
});
export const insertCampaignRecipientSchema = createInsertSchema(
  campaignRecipients
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationAssignmentSchema = createInsertSchema(
  conversationAssignments
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserActivityLogSchema = createInsertSchema(
  userActivityLogs
).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type AutomationNode = typeof automationNodes.$inferSelect;
export type InsertAutomationNode = z.infer<typeof insertAutomationNodeSchema>;
export type AutomationExecution = typeof automationExecutions.$inferSelect;
export type InsertAutomationExecution = z.infer<
  typeof insertAutomationExecutionSchema
>;
export type AutomationExecutionLog =
  typeof automationExecutionLogs.$inferSelect;
export type InsertAutomationExecutionLog = z.infer<
  typeof insertAutomationExecutionLogSchema
>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type WhatsappChannel = typeof whatsappChannels.$inferSelect;
export type InsertWhatsappChannel = z.infer<typeof insertWhatsappChannelSchema>;
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = z.infer<typeof insertWebhookConfigSchema>;
export type MessageQueue = typeof messageQueue.$inferSelect;
export type InsertMessageQueue = z.infer<typeof insertMessageQueueSchema>;
export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = z.infer<typeof insertApiLogSchema>;
export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = z.infer<
  typeof insertCampaignRecipientSchema
>;
export type ConversationAssignment =
  typeof conversationAssignments.$inferSelect;
export type InsertConversationAssignment = z.infer<
  typeof insertConversationAssignmentSchema
>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type PanelConfig = typeof panelConfig.$inferSelect;
export type NewPanelConfig = typeof panelConfig.$inferInsert;

// Drizzle Relations for proper joins and queries
export const channelsRelations = relations(channels, ({ many }) => ({
  contacts: many(contacts),
  campaigns: many(campaigns),
  templates: many(templates),
  conversations: many(conversations),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  channel: one(channels, {
    fields: [contacts.channelId],
    references: [channels.id],
  }),
  conversations: many(conversations),
  campaignRecipients: many(campaignRecipients),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  channel: one(channels, {
    fields: [campaigns.channelId],
    references: [channels.id],
  }),
  template: one(templates, {
    fields: [campaigns.templateId],
    references: [templates.id],
  }),
  recipients: many(campaignRecipients),
}));

export const campaignRecipientsRelations = relations(
  campaignRecipients,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignRecipients.campaignId],
      references: [campaigns.id],
    }),
    contact: one(contacts, {
      fields: [campaignRecipients.contactId],
      references: [contacts.id],
    }),
  })
);

export const templatesRelations = relations(templates, ({ one, many }) => ({
  channel: one(channels, {
    fields: [templates.channelId],
    references: [channels.id],
  }),
  campaigns: many(campaigns),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    channel: one(channels, {
      fields: [conversations.channelId],
      references: [channels.id],
    }),
    contact: one(contacts, {
      fields: [conversations.contactId],
      references: [contacts.id],
    }),

    messages: many(messages),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedConversations: many(conversationAssignments, {
    relationName: "conversation_assigned_user", // matches user side
  }),
  assignedByConversations: many(conversationAssignments, {
    relationName: "conversation_assigned_by_user", // matches assignedBy side
  }),
  activityLogs: many(userActivityLogs),
}));

export const conversationAssignmentsRelations = relations(
  conversationAssignments,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationAssignments.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationAssignments.userId],
      references: [users.id],
      relationName: "conversation_assigned_user",
    }),
    assignedByUser: one(users, {
      fields: [conversationAssignments.assignedBy],
      references: [users.id],
      relationName: "conversation_assigned_by_user",
    }),
  })
);

export const userActivityLogsRelations = relations(
  userActivityLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [userActivityLogs.userId],
      references: [users.id],
    }),
  })
);

export const automationsRelations = relations(automations, ({ one, many }) => ({
  channel: one(channels, {
    fields: [automations.channelId],
    references: [channels.id],
  }),
  createdByUser: one(users, {
    fields: [automations.createdBy],
    references: [users.id],
  }),
  nodes: many(automationNodes),
  edges: many(automationEdges),
  executions: many(automationExecutions),
}));

export const automationNodesRelations = relations(
  automationNodes,
  ({ one }) => ({
    automation: one(automations, {
      fields: [automationNodes.automationId],
      references: [automations.id],
    }),
  })
);

export const automationEdgesRelations = relations(
  automationEdges,
  ({ one }) => ({
    automation: one(automations, {
      fields: [automationEdges.automationId],
      references: [automations.id],
    }),
  })
);

export const automationExecutionsRelations = relations(
  automationExecutions,
  ({ one, many }) => ({
    automation: one(automations, {
      fields: [automationExecutions.automationId],
      references: [automations.id],
    }),
    contact: one(contacts, {
      fields: [automationExecutions.contactId],
      references: [contacts.id],
    }),
    conversation: one(conversations, {
      fields: [automationExecutions.conversationId],
      references: [conversations.id],
    }),
    logs: many(automationExecutionLogs),
  })
);

export const automationExecutionLogsRelations = relations(
  automationExecutionLogs,
  ({ one }) => ({
    execution: one(automationExecutions, {
      fields: [automationExecutionLogs.executionId],
      references: [automationExecutions.id],
    }),
  })
);
