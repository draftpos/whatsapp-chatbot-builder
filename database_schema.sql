--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    date timestamp without time zone NOT NULL,
    messages_sent integer DEFAULT 0,
    messages_delivered integer DEFAULT 0,
    messages_read integer DEFAULT 0,
    messages_replied integer DEFAULT 0,
    new_contacts integer DEFAULT 0,
    active_campaigns integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    channel_id character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: api_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    channel_id character varying,
    request_type character varying(50) NOT NULL,
    endpoint text NOT NULL,
    method character varying(10) NOT NULL,
    request_body jsonb,
    response_status integer,
    response_body jsonb,
    duration integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: automations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    trigger jsonb NOT NULL,
    actions jsonb NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'inactive'::text,
    execution_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    channel_id character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: campaign_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    campaign_id character varying NOT NULL,
    contact_id character varying,
    phone text NOT NULL,
    name text,
    status text DEFAULT 'pending'::text,
    whatsapp_message_id character varying,
    template_params jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    read_at timestamp without time zone,
    error_code character varying,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    api_type text NOT NULL,
    template_id character varying,
    recipients jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'draft'::text,
    scheduled_at timestamp without time zone,
    sent_count integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    read_count integer DEFAULT 0,
    replied_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    channel_id character varying,
    recipient_count integer DEFAULT 0,
    completed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now(),
    campaign_type text,
    template_name text,
    template_language text,
    variable_mapping jsonb DEFAULT '{}'::jsonb,
    contact_groups jsonb DEFAULT '[]'::jsonb,
    csv_data jsonb DEFAULT '[]'::jsonb,
    api_key character varying(255),
    api_endpoint text
);


--
-- Name: channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone_number_id text NOT NULL,
    access_token text NOT NULL,
    whatsapp_business_account_id text,
    phone_number text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    mm_lite_enabled boolean DEFAULT false,
    mm_lite_api_url text,
    mm_lite_api_key text,
    health_status text DEFAULT 'unknown'::text,
    last_health_check timestamp without time zone,
    health_details jsonb DEFAULT '{}'::jsonb
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    groups jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'active'::text,
    last_contact timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    channel_id character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: conversation_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_assignments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying NOT NULL,
    team_member_id character varying NOT NULL,
    assigned_by character varying,
    assigned_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'active'::text NOT NULL,
    priority text DEFAULT 'normal'::text,
    notes text,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contact_id character varying NOT NULL,
    assigned_to character varying,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'normal'::text,
    tags jsonb DEFAULT '[]'::jsonb,
    last_message_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    contact_phone character varying,
    contact_name character varying,
    unread_count integer DEFAULT 0,
    channel_id character varying,
    updated_at timestamp without time zone DEFAULT now(),
    last_message_text text
);


--
-- Name: message_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_queue (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    campaign_id character varying,
    channel_id character varying,
    recipient_phone character varying(20) NOT NULL,
    template_name character varying(100),
    template_params jsonb DEFAULT '[]'::jsonb,
    message_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'queued'::character varying,
    attempts integer DEFAULT 0,
    whatsapp_message_id character varying(100),
    conversation_id character varying(100),
    sent_via character varying(20),
    cost character varying(20),
    error_code character varying(50),
    error_message text,
    scheduled_for timestamp without time zone,
    processed_at timestamp without time zone,
    delivered_at timestamp without time zone,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying NOT NULL,
    from_user boolean DEFAULT false,
    content text NOT NULL,
    type text DEFAULT 'text'::text,
    status text DEFAULT 'sent'::text,
    created_at timestamp without time zone DEFAULT now(),
    whatsapp_message_id character varying,
    direction character varying DEFAULT 'outbound'::character varying,
    message_type character varying,
    "timestamp" timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    delivered_at timestamp without time zone,
    read_at timestamp without time zone,
    error_code character varying(50),
    error_message text,
    updated_at timestamp without time zone DEFAULT now(),
    error_details jsonb,
    campaign_id character varying
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: team_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_activity_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    team_member_id character varying NOT NULL,
    action text NOT NULL,
    entity_type text,
    entity_id character varying,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text DEFAULT 'agent'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    avatar text,
    department text,
    last_active timestamp without time zone,
    online_status text DEFAULT 'offline'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    language text DEFAULT 'en_US'::text,
    header text,
    body text NOT NULL,
    footer text,
    buttons jsonb DEFAULT '[]'::jsonb,
    variables jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'draft'::text,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    channel_id character varying,
    media_type text DEFAULT 'text'::text,
    media_url text,
    media_handle text,
    carousel_cards jsonb DEFAULT '[]'::jsonb,
    whatsapp_template_id text,
    updated_at timestamp without time zone DEFAULT now(),
    rejection_reason text
);


--
-- Name: user_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_logs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(255),
    details jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text,
    first_name text,
    last_name text,
    role text DEFAULT 'admin'::text,
    created_at timestamp without time zone DEFAULT now(),
    status character varying(20) DEFAULT 'active'::character varying,
    permissions text[] DEFAULT '{}'::text[],
    avatar character varying(255),
    last_login timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: webhook_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_configs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    channel_id character varying,
    webhook_url text NOT NULL,
    verify_token character varying(100) NOT NULL,
    app_secret text,
    events jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    last_ping_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: whatsapp_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_channels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone_number character varying(20) NOT NULL,
    phone_number_id character varying(50) NOT NULL,
    waba_id character varying(50) NOT NULL,
    access_token text NOT NULL,
    business_account_id character varying(50),
    mm_lite_enabled boolean DEFAULT false,
    rate_limit_tier character varying(20) DEFAULT 'standard'::character varying,
    quality_rating character varying(20) DEFAULT 'green'::character varying,
    status character varying(20) DEFAULT 'inactive'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    error_message text,
    last_health_check timestamp without time zone,
    message_limit integer,
    messages_used integer
);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: api_logs api_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_logs
    ADD CONSTRAINT api_logs_pkey PRIMARY KEY (id);


--
-- Name: automations automations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_pkey PRIMARY KEY (id);


--
-- Name: campaign_recipients campaign_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: channels channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: conversation_assignments conversation_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_assignments
    ADD CONSTRAINT conversation_assignments_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: message_queue message_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_queue
    ADD CONSTRAINT message_queue_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: team_activity_logs team_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_activity_logs
    ADD CONSTRAINT team_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_email_key UNIQUE (email);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: user_activity_logs user_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: webhook_configs webhook_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_configs
    ADD CONSTRAINT webhook_configs_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_channels whatsapp_channels_phone_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_channels
    ADD CONSTRAINT whatsapp_channels_phone_number_unique UNIQUE (phone_number);


--
-- Name: whatsapp_channels whatsapp_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_channels
    ADD CONSTRAINT whatsapp_channels_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: campaigns_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_channel_idx ON public.campaigns USING btree (channel_id);


--
-- Name: campaigns_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_created_idx ON public.campaigns USING btree (created_at);


--
-- Name: campaigns_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_status_idx ON public.campaigns USING btree (status);


--
-- Name: contacts_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_channel_idx ON public.contacts USING btree (channel_id);


--
-- Name: contacts_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_phone_idx ON public.contacts USING btree (phone);


--
-- Name: contacts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_status_idx ON public.contacts USING btree (status);


--
-- Name: conv_assignments_conv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conv_assignments_conv_idx ON public.conversation_assignments USING btree (conversation_id);


--
-- Name: conv_assignments_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conv_assignments_member_idx ON public.conversation_assignments USING btree (team_member_id);


--
-- Name: conv_assignments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conv_assignments_status_idx ON public.conversation_assignments USING btree (status);


--
-- Name: conversations_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_channel_idx ON public.conversations USING btree (channel_id);


--
-- Name: conversations_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_contact_idx ON public.conversations USING btree (contact_id);


--
-- Name: conversations_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_phone_idx ON public.conversations USING btree (contact_phone);


--
-- Name: conversations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_status_idx ON public.conversations USING btree (status);


--
-- Name: idx_user_activity_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_logs_action ON public.user_activity_logs USING btree (action);


--
-- Name: idx_user_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs USING btree (created_at);


--
-- Name: idx_user_activity_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs USING btree (user_id);


--
-- Name: messages_conversation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_conversation_idx ON public.messages USING btree (conversation_id);


--
-- Name: messages_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_created_idx ON public.messages USING btree (created_at);


--
-- Name: messages_direction_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_direction_idx ON public.messages USING btree (direction);


--
-- Name: messages_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_status_idx ON public.messages USING btree (status);


--
-- Name: messages_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_timestamp_idx ON public.messages USING btree ("timestamp");


--
-- Name: messages_whatsapp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_whatsapp_idx ON public.messages USING btree (whatsapp_message_id);


--
-- Name: recipients_campaign_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipients_campaign_idx ON public.campaign_recipients USING btree (campaign_id);


--
-- Name: recipients_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipients_phone_idx ON public.campaign_recipients USING btree (phone);


--
-- Name: recipients_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipients_status_idx ON public.campaign_recipients USING btree (status);


--
-- Name: team_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_logs_action_idx ON public.team_activity_logs USING btree (action);


--
-- Name: team_logs_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_logs_created_idx ON public.team_activity_logs USING btree (created_at);


--
-- Name: team_logs_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_logs_member_idx ON public.team_activity_logs USING btree (team_member_id);


--
-- Name: team_members_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_members_email_idx ON public.team_members USING btree (email);


--
-- Name: team_members_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_members_status_idx ON public.team_members USING btree (status);


--
-- Name: team_members_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_members_user_idx ON public.team_members USING btree (user_id);


--
-- Name: api_logs api_logs_channel_id_whatsapp_channels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_logs
    ADD CONSTRAINT api_logs_channel_id_whatsapp_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.whatsapp_channels(id);


--
-- Name: conversation_assignments conversation_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE conversation_assignments
ADD CONSTRAINT conversation_assignments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


-- ALTER TABLE ONLY public.conversation_assignments
--     ADD CONSTRAINT conversation_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.team_members(id);


--
-- Name: conversation_assignments conversation_assignments_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_assignments
    ADD CONSTRAINT conversation_assignments_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_assignments conversation_assignments_team_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

-- ALTER TABLE ONLY public.conversation_assignments
--     ADD CONSTRAINT conversation_assignments_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.team_members(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients fk_campaign_recipients_campaign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT fk_campaign_recipients_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: message_queue message_queue_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_queue
    ADD CONSTRAINT message_queue_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: message_queue message_queue_channel_id_whatsapp_channels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_queue
    ADD CONSTRAINT message_queue_channel_id_whatsapp_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.whatsapp_channels(id);


--
-- Name: messages messages_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;


--
-- Name: team_activity_logs team_activity_logs_team_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_activity_logs
    ADD CONSTRAINT team_activity_logs_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.team_members(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: templates templates_channel_id_channels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);


--
-- Name: user_activity_logs user_activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

