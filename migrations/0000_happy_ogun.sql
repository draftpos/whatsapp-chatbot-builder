CREATE TABLE "analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"date" timestamp NOT NULL,
	"messages_sent" integer DEFAULT 0,
	"messages_delivered" integer DEFAULT 0,
	"messages_read" integer DEFAULT 0,
	"messages_replied" integer DEFAULT 0,
	"new_contacts" integer DEFAULT 0,
	"active_campaigns" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"request_type" varchar(50) NOT NULL,
	"endpoint" text NOT NULL,
	"method" varchar(10) NOT NULL,
	"request_body" jsonb,
	"response_status" integer,
	"response_body" jsonb,
	"duration" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_execution_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar NOT NULL,
	"node_id" varchar NOT NULL,
	"node_type" text NOT NULL,
	"status" text NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb,
	"output" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"executed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_executions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" varchar NOT NULL,
	"contact_id" varchar,
	"conversation_id" varchar,
	"trigger_data" jsonb DEFAULT '{}'::jsonb,
	"status" text NOT NULL,
	"current_node_id" varchar,
	"execution_path" jsonb DEFAULT '[]'::jsonb,
	"variables" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "automation_nodes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" varchar NOT NULL,
	"node_id" varchar NOT NULL,
	"type" text NOT NULL,
	"subtype" text,
	"position" jsonb DEFAULT '{}'::jsonb,
	"data" jsonb DEFAULT '{}'::jsonb,
	"connections" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "automation_nodes_unique_idx" UNIQUE("automation_id","node_id")
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"trigger" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'inactive',
	"execution_count" integer DEFAULT 0,
	"last_executed_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_recipients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"contact_id" varchar,
	"phone" text NOT NULL,
	"name" text,
	"status" text DEFAULT 'pending',
	"whatsapp_message_id" varchar,
	"template_params" jsonb DEFAULT '{}'::jsonb,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"error_code" varchar,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "campaign_phone_unique" UNIQUE("campaign_id","phone")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"campaign_type" text NOT NULL,
	"type" text NOT NULL,
	"api_type" text NOT NULL,
	"template_id" varchar,
	"template_name" text,
	"template_language" text,
	"variable_mapping" jsonb DEFAULT '{}'::jsonb,
	"contact_groups" jsonb DEFAULT '[]'::jsonb,
	"csv_data" jsonb DEFAULT '[]'::jsonb,
	"api_key" varchar,
	"api_endpoint" text,
	"status" text DEFAULT 'draft',
	"scheduled_at" timestamp,
	"recipient_count" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"delivered_count" integer DEFAULT 0,
	"read_count" integer DEFAULT 0,
	"replied_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_number_id" text NOT NULL,
	"access_token" text NOT NULL,
	"whatsapp_business_account_id" text,
	"phone_number" text,
	"is_active" boolean DEFAULT true,
	"health_status" text DEFAULT 'unknown',
	"last_health_check" timestamp,
	"health_details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"groups" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'active',
	"last_contact" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "contacts_channel_phone_unique" UNIQUE("channel_id","phone")
);
--> statement-breakpoint
CREATE TABLE "conversation_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"assigned_by" varchar,
	"assigned_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'active' NOT NULL,
	"priority" text DEFAULT 'normal',
	"notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"contact_id" varchar,
	"assigned_to" varchar,
	"contact_phone" varchar,
	"contact_name" varchar,
	"status" text DEFAULT 'open',
	"priority" text DEFAULT 'normal',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"unread_count" integer DEFAULT 0,
	"last_message_at" timestamp,
	"last_message_text" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar,
	"channel_id" varchar,
	"recipient_phone" varchar(20) NOT NULL,
	"template_name" varchar(100),
	"template_params" jsonb DEFAULT '[]'::jsonb,
	"message_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'queued',
	"attempts" integer DEFAULT 0,
	"whatsapp_message_id" varchar(100),
	"conversation_id" varchar(100),
	"sent_via" varchar(20),
	"cost" varchar(20),
	"error_code" varchar(50),
	"error_message" text,
	"scheduled_for" timestamp,
	"processed_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"whatsapp_message_id" varchar,
	"from_user" boolean DEFAULT false,
	"direction" varchar DEFAULT 'outbound',
	"content" text NOT NULL,
	"type" text DEFAULT 'text',
	"message_type" varchar,
	"status" text DEFAULT 'sent',
	"timestamp" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"error_code" varchar(50),
	"error_message" text,
	"error_details" jsonb,
	"campaign_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"language" text DEFAULT 'en_US',
	"header" text,
	"body" text NOT NULL,
	"footer" text,
	"buttons" jsonb DEFAULT '[]'::jsonb,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft',
	"rejection_reason" text,
	"media_type" text DEFAULT 'text',
	"media_url" text,
	"media_handle" text,
	"carousel_cards" jsonb DEFAULT '[]'::jsonb,
	"whatsapp_template_id" text,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" varchar,
	"details" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"avatar" text,
	"status" text DEFAULT 'active' NOT NULL,
	"permissions" text[] NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar,
	"webhook_url" text NOT NULL,
	"verify_token" varchar(100) NOT NULL,
	"app_secret" text,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_ping_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"phone_number_id" varchar(50) NOT NULL,
	"waba_id" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"business_account_id" varchar(50),
	"rate_limit_tier" varchar(20) DEFAULT 'standard',
	"quality_rating" varchar(20) DEFAULT 'green',
	"status" varchar(20) DEFAULT 'inactive',
	"error_message" text,
	"last_health_check" timestamp,
	"message_limit" integer,
	"messages_used" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_channels_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_channel_id_whatsapp_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."whatsapp_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_execution_logs" ADD CONSTRAINT "automation_execution_logs_execution_id_automation_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."automation_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_nodes" ADD CONSTRAINT "automation_nodes_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assignments" ADD CONSTRAINT "conversation_assignments_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assignments" ADD CONSTRAINT "conversation_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_queue" ADD CONSTRAINT "message_queue_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_queue" ADD CONSTRAINT "message_queue_channel_id_whatsapp_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."whatsapp_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_execution_logs_execution_idx" ON "automation_execution_logs" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "automation_executions_automation_idx" ON "automation_executions" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "automation_executions_status_idx" ON "automation_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_nodes_automation_idx" ON "automation_nodes" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "automations_channel_idx" ON "automations" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "automations_status_idx" ON "automations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recipients_campaign_idx" ON "campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "recipients_status_idx" ON "campaign_recipients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recipients_phone_idx" ON "campaign_recipients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "campaigns_channel_idx" ON "campaigns" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_created_idx" ON "campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contacts_channel_idx" ON "contacts" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "contacts_status_idx" ON "contacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversations_channel_idx" ON "conversations" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "conversations_contact_idx" ON "conversations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "conversations_phone_idx" ON "conversations" USING btree ("contact_phone");--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_whatsapp_idx" ON "messages" USING btree ("whatsapp_message_id");--> statement-breakpoint
CREATE INDEX "messages_direction_idx" ON "messages" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_timestamp_idx" ON "messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");