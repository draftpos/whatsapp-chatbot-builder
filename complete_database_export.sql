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

ALTER TABLE ONLY public.conversation_assignments
    ADD CONSTRAINT conversation_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.team_members(id);


--
-- Name: conversation_assignments conversation_assignments_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_assignments
    ADD CONSTRAINT conversation_assignments_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_assignments conversation_assignments_team_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_assignments
    ADD CONSTRAINT conversation_assignments_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.team_members(id) ON DELETE CASCADE;


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

--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: whatsapp_channels; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.whatsapp_channels VALUES ('d420e261-9c12-4cee-9d65-253cda8ab4bc', 'Test', '+15551017536', '153851904474202', '152578724602116', 'EAAJcBVwZAYfoBPNZCHBBWBh4lNLt0SuU8JklS8Y4tVZAaQb4d0gHJeNj4qweITRCOunoSbHm0SzuvC1gc9rhamYI66p72SbFfJIvFz2DTos5ipVYYip1jJmbDWkjuqCH9KVZBKKU8I5DLjFSB0lSwdeY8kxzyMgxkLOgZAxpC7lFUTLhy47N9xgs6eRA4uz0BjYdnOVw9hYByYcFcEO6Eq4IaUUd7fwxyZAKN57jVY2UgMsVfI', '', true, 'standard', 'green', 'active', '2025-08-02 08:07:18.941927', '2025-08-02 08:07:36.994', NULL, '2025-08-02 08:07:36.994', NULL, NULL);


--
-- Data for Name: api_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.api_logs VALUES ('66424dff-54bd-4b8f-a22c-31dc632fc5f9', 'd420e261-9c12-4cee-9d65-253cda8ab4bc', 'send_message', 'https://graph.facebook.com/v18.0/153851904474202/messages', 'POST', '{"to": "919310797700", "type": "template", "template": {"name": "hello_world", "language": {"code": "en_US"}}, "recipient_type": "individual", "messaging_product": "whatsapp"}', 200, '{"contacts": [{"input": "919310797700", "wa_id": "919310797700"}], "messages": [{"id": "wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSMTc5RUQwNUY0ODBDN0FERUIxAA==", "message_status": "accepted"}], "messaging_product": "whatsapp"}', 1005, '2025-08-02 08:07:36.836145');
INSERT INTO public.api_logs VALUES ('d69647ef-74ae-440c-ad8f-9d0e7c987715', 'd420e261-9c12-4cee-9d65-253cda8ab4bc', 'test_connection', 'https://graph.facebook.com/v22.0/153851904474202/messages', 'POST', '{"to": "919310797700", "type": "template", "template": {"name": "hello_world", "language": {"code": "en_US"}}, "messaging_product": "whatsapp"}', 200, '{"contacts": [{"input": "919310797700", "wa_id": "919310797700"}], "messages": [{"id": "wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSMTc5RUQwNUY0ODBDN0FERUIxAA==", "message_status": "accepted"}], "messaging_product": "whatsapp"}', 0, '2025-08-02 08:07:36.942611');
INSERT INTO public.api_logs VALUES ('d8e6d31c-48ef-4042-8135-eeba9480f56d', 'd420e261-9c12-4cee-9d65-253cda8ab4bc', 'send_message', 'https://graph.facebook.com/v23.0/153851904474202/messages', 'POST', '{"to": "+919310797700", "text": {"body": "test"}, "type": "text", "recipient_type": "individual", "messaging_product": "whatsapp"}', 401, '{"error": {"code": 190, "type": "OAuthException", "message": "Error validating access token: Session has expired on Saturday, 02-Aug-25 02:00:00 PDT. The current time is Saturday, 02-Aug-25 02:17:25 PDT.", "fbtrace_id": "Aohb9L9HQ7wANNZnq-t_kJK", "error_subcode": 463}}', 224, '2025-08-02 09:17:26.155532');
INSERT INTO public.api_logs VALUES ('4bc5f0cc-56ed-445a-b364-7788eaade80b', 'd420e261-9c12-4cee-9d65-253cda8ab4bc', 'send_message', 'https://graph.facebook.com/v23.0/153851904474202/messages', 'POST', '{"to": "+919310797700", "text": {"body": "Test"}, "type": "text", "recipient_type": "individual", "messaging_product": "whatsapp"}', 401, '{"error": {"code": 190, "type": "OAuthException", "message": "Error validating access token: Session has expired on Saturday, 02-Aug-25 02:00:00 PDT. The current time is Saturday, 02-Aug-25 03:35:03 PDT.", "fbtrace_id": "AU2GDoms7Xp-K35uB7oene_", "error_subcode": 463}}', 138, '2025-08-02 10:35:03.366945');
INSERT INTO public.api_logs VALUES ('77974844-2871-4f9c-bd1b-33b63bd601e9', 'd420e261-9c12-4cee-9d65-253cda8ab4bc', 'send_message', 'https://graph.facebook.com/v23.0/153851904474202/messages', 'POST', '{"to": "+919310797700", "text": {"body": "Test"}, "type": "text", "recipient_type": "individual", "messaging_product": "whatsapp"}', 401, '{"error": {"code": 190, "type": "OAuthException", "message": "Error validating access token: Session has expired on Saturday, 02-Aug-25 02:00:00 PDT. The current time is Saturday, 02-Aug-25 03:35:12 PDT.", "fbtrace_id": "Avv9nrbwYiDyRJeRs3zrgqB", "error_subcode": 463}}', 92, '2025-08-02 10:35:12.578754');
INSERT INTO public.api_logs VALUES ('dd0f09fa-ab65-477c-8ebc-9d6c5ad33a7e', 'd420e261-9c12-4cee-9d65-253cda8ab4bc', 'send_message', 'https://graph.facebook.com/v23.0/153851904474202/messages', 'POST', '{"to": "+919310797700", "text": {"body": "Test"}, "type": "text", "recipient_type": "individual", "messaging_product": "whatsapp"}', 401, '{"error": {"code": 190, "type": "OAuthException", "message": "Error validating access token: Session has expired on Saturday, 02-Aug-25 02:00:00 PDT. The current time is Saturday, 02-Aug-25 03:35:23 PDT.", "fbtrace_id": "Ar73rKMjfDyVjGiYOJJbUXb", "error_subcode": 463}}', 91, '2025-08-02 10:35:23.692367');


--
-- Data for Name: automations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.campaigns VALUES ('eb3edf54-cd25-40d8-ae20-27f398adef6f', 'Friday Sale', 'Demo', 'marketing', 'mm_lite', 'da0d30d1-6f56-477d-bce1-4d60c7e79f1b', '[]', 'active', NULL, 0, 0, 0, 0, 1, '2025-08-03 10:13:47.115195', 'f8e8f949-a099-47e7-a999-94774a6890ab', 3, NULL, '2025-08-03 10:13:47.115195', 'contacts', 'welcome', 'en_US', '{}', '["62535089-4404-459e-a4b1-acb704769856", "b0ba7793-d640-4295-9a98-1c963c5c76da", "646b6db5-0452-4992-8a8f-e54feb18bec5"]', '[]', NULL, NULL);
INSERT INTO public.campaigns VALUES ('a69b818e-e823-4295-87ce-2019511b699a', 'Test-1', 'test', 'marketing', 'mm_lite', 'da0d30d1-6f56-477d-bce1-4d60c7e79f1b', '[]', 'completed', NULL, 2, 0, 0, 0, 0, '2025-08-02 21:36:39.586624', 'f8e8f949-a099-47e7-a999-94774a6890ab', 2, '2025-08-02 21:40:10.585', '2025-08-02 21:36:39.586624', 'contacts', 'welcome', 'en_US', '{}', '["e1a9cc3f-f47c-4178-8cc2-08e6626ae766", "513e2fde-d8bb-4afd-a60a-50a752c60110"]', '[]', NULL, NULL);
INSERT INTO public.campaigns VALUES ('0223a6f4-3807-4406-b709-2e18e9e0d33b', 'cam-2', '', 'marketing', 'mm_lite', '8824aeb5-eb86-4ba9-bd4d-cca4e353b3c9', '[]', 'completed', NULL, 0, 0, 0, 0, 0, '2025-08-02 21:50:40.429775', 'f8e8f949-a099-47e7-a999-94774a6890ab', 0, '2025-08-02 21:50:40.893', '2025-08-02 21:50:40.429775', 'api', 'hello_world', 'en', '{"1": "name"}', '[]', '[]', 'ww_f38265f2fd1c40bf9ad0a251986a55a2', 'http://d6a63d6e-5577-4d02-80b7-0b54ffbd5ab5-00-3ci9wfzjd76hb.worf.replit.dev/api/campaigns/send/ww_f38265f2fd1c40bf9ad0a251986a55a2');
INSERT INTO public.campaigns VALUES ('8317fc19-b241-4c12-9848-a244f8a4dfe8', 'API', '', 'marketing', 'mm_lite', 'da0d30d1-6f56-477d-bce1-4d60c7e79f1b', '[]', 'completed', NULL, 0, 0, 0, 0, 0, '2025-08-02 21:58:55.811185', 'f8e8f949-a099-47e7-a999-94774a6890ab', 0, '2025-08-02 21:58:56.278', '2025-08-02 21:58:55.811185', 'api', 'welcome', 'en_US', '{}', '[]', '[]', 'ww_4e6e77b61c4b44a1bf29a70897b024d8', 'http://d6a63d6e-5577-4d02-80b7-0b54ffbd5ab5-00-3ci9wfzjd76hb.worf.replit.dev/api/campaigns/send/ww_4e6e77b61c4b44a1bf29a70897b024d8');
INSERT INTO public.campaigns VALUES ('f551fc0e-db18-46d2-b313-e6f416c24f91', 'cam-2', '', 'marketing', 'mm_lite', 'da0d30d1-6f56-477d-bce1-4d60c7e79f1b', '[]', 'active', NULL, 0, 0, 0, 0, 1, '2025-08-02 21:49:58.543029', 'f8e8f949-a099-47e7-a999-94774a6890ab', 2, NULL, '2025-08-02 21:49:58.543029', 'contacts', 'welcome', 'en_US', '{}', '["646b6db5-0452-4992-8a8f-e54feb18bec5"]', '[]', NULL, NULL);


--
-- Data for Name: campaign_recipients; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: channels; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.channels VALUES ('f8e8f949-a099-47e7-a999-94774a6890ab', 'diploy', '772435939278105', 'EAAJcBVwZAYfoBPC9lveUFcEkUEjKpBihacOBproLyy6QWPWKrIiZAQzwpdtDyjnOEAzT6PGo7TdjWNbkUgsZCizDOHV3GlpdSKuehfaGLpwiJFcZAOHLLEMotqisk68HrGySJVJJwXetlNQTqEnZBDp2nJowUZBCJvZBWLLcQHGDVIFs8TPXR3mf9Hc5ZBKKbXd6nHLtA0BWubCOxyzmuAMF2kXImMEMrEfwHSCU5SVg', '721278144105786', '+918384008805', true, '2025-08-02 13:20:07.449406', '2025-08-02 13:20:07.449406', true, NULL, NULL, 'warning', '2025-08-06 06:56:38.101', '{"status": "LIVE", "name_status": "APPROVED", "phone_number": "+91 83840 08805", "quality_rating": "GREEN", "messaging_limit": "TIER_1K", "throughput_level": "STANDARD", "verification_status": "NOT_VERIFIED"}');
INSERT INTO public.channels VALUES ('b74ab99e-543c-4781-be8e-e5524973eb0f', 'Test', '153851904474202', 'EAAJcBVwZAYfoBPEcT0PZAZAGUZCxAZAbZC6NkdZBLS6OJCrEfw6JAHtHayjSIiTDXuvRGfwm8ZAy5N7VEiuDRiqY4ZBhpxlXXwDtUKBIVgw300WheNz7zaqp3Mwpg4keluLEvor8DyqsGGMTomvoY38DNLBIzroz6hNyozyVkWqXVt3RMprmEX7AaQZCItcZCIp89lZAwJP5njewwref6KwJMoBGbSDIZCQmc9ErXWPn8GETZA78ZBL5LkZD', '152578724602116', '+15551017536', false, '2025-08-02 12:24:53.392423', '2025-08-02 12:24:53.392423', false, NULL, NULL, 'error', '2025-08-06 06:56:41.244', '{"error": "Network or system error", "details": "insert or update on table \"api_logs\" violates foreign key constraint \"api_logs_channel_id_whatsapp_channels_id_fk\""}');


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.contacts VALUES ('646b6db5-0452-4992-8a8f-e54feb18bec5', 'Neeraj Bisht', '+919310797700', 'nb@diploy.in', '["New"]', '[]', 'active', NULL, '2025-08-02 09:17:08.497877', 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178');
INSERT INTO public.contacts VALUES ('b0ba7793-d640-4295-9a98-1c963c5c76da', 'Bhumika', '+918433147909', '', '[]', '[]', 'active', NULL, '2025-08-02 16:26:49.705186', 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178');
INSERT INTO public.contacts VALUES ('9cb6d6e9-65db-4099-8bb7-5693ba2489a4', '+1234567890', '+1234567890', NULL, '[]', '[]', 'active', NULL, '2025-08-02 16:53:06.082427', 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178');
INSERT INTO public.contacts VALUES ('62535089-4404-459e-a4b1-acb704769856', 'Printfuse', '+918882999015', '', '[]', '[]', 'active', NULL, '2025-08-03 07:37:15.285389', 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-03 07:37:15.285389');
INSERT INTO public.contacts VALUES ('9131aa83-6666-48a3-83b5-59cecfcf7b7e', 'Vinod', '+918368806708', '', '[]', '[]', 'active', NULL, '2025-08-04 07:34:40.821772', 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-04 07:34:40.821772');
INSERT INTO public.contacts VALUES ('405f885a-3e20-4347-a993-1d7653b11bbf', 'Kishan', '+917055472764', '', '[]', '[]', 'active', NULL, '2025-08-04 12:30:46.901076', 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-04 12:30:46.901076');
INSERT INTO public.contacts VALUES ('7230df72-7b0d-4ff1-a2d5-ffd4c155ff37', 'Software Developer', '918368806708', NULL, '[]', '[]', 'active', NULL, '2025-08-04 12:33:16.687501', 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-04 12:33:16.687501');


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.conversations VALUES ('d086423d-1931-41ac-88fe-efd1f49937f1', '405f885a-3e20-4347-a993-1d7653b11bbf', NULL, 'active', 'normal', '[]', '2025-08-04 12:31:08.144', '2025-08-04 12:31:07.970659', '+917055472764', 'Kishan', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-04 12:31:07.970659', NULL);
INSERT INTO public.conversations VALUES ('dd0cdf03-f845-4a7b-97b1-f79f16305333', '918828006272', NULL, 'open', 'normal', '[]', '2025-08-02 16:02:36', '2025-08-02 16:02:40.528967', '918828006272', '918828006272', 1, NULL, '2025-08-02 19:53:08.748178', NULL);
INSERT INTO public.conversations VALUES ('fad33c66-3ac2-41ec-ba5c-45db1c910804', '7230df72-7b0d-4ff1-a2d5-ffd4c155ff37', NULL, 'open', 'normal', '[]', '2025-08-04 12:33:50.757', '2025-08-04 12:33:16.792283', '918368806708', 'Software Developer', 1, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-04 12:33:16.792283', NULL);
INSERT INTO public.conversations VALUES ('4d7fff51-bf4b-4143-a2b1-7682c7dc2834', '9cb6d6e9-65db-4099-8bb7-5693ba2489a4', NULL, 'open', 'normal', '[]', NULL, '2025-08-02 16:53:06.193491', '+1234567890', '+1234567890', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178', NULL);
INSERT INTO public.conversations VALUES ('be363c06-d040-440b-944d-a5c566c0ded1', '16315551181', NULL, 'open', 'normal', '[]', '2017-09-08 20:36:28', '2025-08-02 09:09:11.249696', '16315551181', 'test user name', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178', NULL);
INSERT INTO public.conversations VALUES ('c06795ae-aa0f-4f6a-82d2-014baa0a788f', 'b0ba7793-d640-4295-9a98-1c963c5c76da', NULL, 'active', 'normal', '[]', '2025-08-02 19:07:12.572', '2025-08-02 16:27:00.041383', '+918433147909', 'Bhumika', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178', NULL);
INSERT INTO public.conversations VALUES ('65dfda53-819a-4baa-b001-e72712ace2a8', 'e1a9cc3f-f47c-4178-8cc2-08e6626ae766', NULL, 'active', 'normal', '[]', '2025-08-02 19:19:56.288', '2025-08-02 19:19:56.131772', '+919990155993', 'M Singh', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178', NULL);
INSERT INTO public.conversations VALUES ('0c288bfd-dfc5-41ac-b18c-b2f64f68aef9', '62535089-4404-459e-a4b1-acb704769856', NULL, 'active', 'normal', '[]', '2025-08-03 08:01:41.011', '2025-08-03 07:37:23.957821', '+918882999015', 'Printfuse', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-03 07:37:23.957821', NULL);
INSERT INTO public.conversations VALUES ('64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', '646b6db5-0452-4992-8a8f-e54feb18bec5', NULL, 'active', 'normal', '[]', '2025-08-03 08:56:35.568', '2025-08-02 15:47:18.008292', '+919310797700', 'Neeraj Bisht', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178', NULL);
INSERT INTO public.conversations VALUES ('9b3b1dd4-d749-451f-a919-72942f0925fc', '513e2fde-d8bb-4afd-a60a-50a752c60110', NULL, 'open', 'normal', '[]', '2025-08-03 10:59:40.551', '2025-08-02 17:45:38.539539', '919310797700', 'diploy', 1, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-02 19:53:08.748178', NULL);
INSERT INTO public.conversations VALUES ('c52b50b9-7103-4664-9916-66c9b294062b', '9131aa83-6666-48a3-83b5-59cecfcf7b7e', NULL, 'active', 'normal', '[]', '2025-08-04 07:34:52.982', '2025-08-04 07:34:52.814018', '+918368806708', 'Vinod', 0, 'f8e8f949-a099-47e7-a999-94774a6890ab', '2025-08-04 07:34:52.814018', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('686714c1-5e87-4277-8975-4f9ac4740617', 'admin', 'admin123', 'admin@whatsway.com', 'Admin', 'User', 'admin', '2025-08-02 18:23:46.683109', 'active', '{}', NULL, NULL, '2025-08-03 19:30:45.358547');
INSERT INTO public.users VALUES ('2cbfa7e7-776d-4184-af77-ee809639a882', 'support1', 'support123', 'support1@whatsway.com', 'Support', 'Agent 1', 'agent', '2025-08-02 18:23:46.683109', 'active', '{}', NULL, NULL, '2025-08-03 19:30:45.358547');
INSERT INTO public.users VALUES ('aae25a9a-b150-4aa4-bf15-d594d9200bb3', 'support2', 'support123', 'support2@whatsway.com', 'Support', 'Agent 2', 'agent', '2025-08-02 18:23:46.683109', 'active', '{}', NULL, NULL, '2025-08-03 19:30:45.358547');
INSERT INTO public.users VALUES ('df0e5ecd-fefc-455e-b18b-6b86c15d2151', 'manager', 'manager123', 'manager@whatsway.com', 'Team', 'Manager', 'manager', '2025-08-02 18:23:46.683109', 'active', '{}', NULL, NULL, '2025-08-03 19:30:45.358547');
INSERT INTO public.users VALUES ('f2e997be-99ce-4de7-a3e5-59363ed118b8', 'whatsway', '$2b$10$ZTop5e/vFkb.9cBu9x0kp.YLw5g/NSwPrs8LpK5L.iRr5J3Qi0ZLq', 'admin@whatsway.com', 'Admin', 'User', 'admin', '2025-08-03 19:31:06.224181', 'active', '{contacts.view,contacts.create,contacts.update,contacts.delete,contacts.export,campaigns.view,campaigns.create,campaigns.update,campaigns.delete,templates.view,templates.create,templates.update,templates.delete,analytics.view,team.view,team.create,team.update,team.delete,settings.view,settings.update,inbox.view,inbox.send,inbox.assign,automations.view,automations.create,automations.update,automations.delete}', NULL, '2025-08-03 19:46:02.952', '2025-08-03 19:46:02.952');


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: conversation_assignments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: message_queue; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.messages VALUES ('3952e820-42d1-4f34-9cb4-5417c6b98547', 'be363c06-d040-440b-944d-a5c566c0ded1', false, 'this is a text message', 'text', 'received', '2025-08-02 09:09:11.357161', 'ABGGFlA5Fpa', 'inbound', 'text', '2017-09-08 20:36:28', '{"from": "16315551181", "type": "text", "channelId": "d420e261-9c12-4cee-9d65-253cda8ab4bc"}', NULL, NULL, NULL, NULL, '2025-08-02 18:54:23.200129', NULL, NULL);
INSERT INTO public.messages VALUES ('9fb0cc45-ad46-4825-951c-d5f1991187ab', '64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', false, 'Template: welcome', 'template', 'read', '2025-08-02 15:47:18.113667', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSOUU3MTQ3QkQxNTMzNDk4NUQyAA==', 'outgoing', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-02 18:54:23.200129', NULL, NULL);
INSERT INTO public.messages VALUES ('54b3cc86-2ee1-460b-9a93-3beb26399f3c', 'dd0cdf03-f845-4a7b-97b1-f79f16305333', false, '', 'text', 'received', '2025-08-02 16:02:40.638104', 'wamid.HBgMOTE4ODI4MDA2MjcyFQIAEhgSOUFGQzgwOTA0RjdFMDY0ODExAA==', 'inbound', 'unsupported', '2025-08-02 16:02:36', '{"from": "918828006272", "type": "unsupported"}', NULL, NULL, NULL, NULL, '2025-08-02 18:54:23.200129', NULL, NULL);
INSERT INTO public.messages VALUES ('fc370b3e-0e23-40d7-8498-e8f8a27894ec', 'c06795ae-aa0f-4f6a-82d2-014baa0a788f', false, 'Template: welcome', 'template', 'delivered', '2025-08-02 19:07:12.512664', 'wamid.HBgMOTE4NDMzMTQ3OTA5FQIAERgSQUI0NEVCODI4NTRBOEU1MDQ1AA==', 'outgoing', NULL, NULL, '{}', '2025-08-02 19:07:17.512', NULL, NULL, NULL, '2025-08-02 19:14:40.492', NULL, NULL);
INSERT INTO public.messages VALUES ('f0a4d60e-9941-438c-9ea3-c8f9b7a1b20c', '64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', false, 'Template: welcome', 'template', 'read', '2025-08-02 19:07:22.072697', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSMjU0RjhCRkRCRkIzOEI2NkQ5AA==', 'outgoing', NULL, NULL, '{}', '2025-08-02 19:07:27.072', '2025-08-02 19:07:37.072', NULL, NULL, '2025-08-02 19:14:40.596', NULL, NULL);
INSERT INTO public.messages VALUES ('97b02f6c-159d-4261-afd9-f6787ce6b5da', 'c06795ae-aa0f-4f6a-82d2-014baa0a788f', false, 'Template: welcome', 'template', 'read', '2025-08-02 16:27:00.148126', 'wamid.HBgMOTE4NDMzMTQ3OTA5FQIAERgSRjMzQTE3RDBFNDU2NzgyM0NCAA==', 'outgoing', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-02 18:54:23.200129', NULL, NULL);
INSERT INTO public.messages VALUES ('1096e5fe-2b39-430a-a020-74d29f3eab77', '9b3b1dd4-d749-451f-a919-72942f0925fc', false, 'okay', 'text', 'received', '2025-08-02 17:45:38.643396', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAEhgWM0VCMDc3NDA0ODhENjVCOTk1RDM0OAA=', 'outbound', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-02 18:54:23.200129', NULL, NULL);
INSERT INTO public.messages VALUES ('d5091437-f722-49b5-beb5-4aa6c29da2f8', 'c06795ae-aa0f-4f6a-82d2-014baa0a788f', false, 'Template: welcome', 'template', 'failed', '2025-08-02 18:51:22.832239', 'wamid.HBgMOTE4NDMzMTQ3OTA5FQIAERgSMDAwRjdEQTE0MzY4N0ZGMkE4AA==', 'outgoing', NULL, NULL, '{}', NULL, NULL, '131049', 'This message was not delivered to maintain healthy ecosystem engagement.', '2025-08-02 18:57:40.723735', NULL, NULL);
INSERT INTO public.messages VALUES ('462d9152-1f83-4cc1-96f4-da979031f812', '4d7fff51-bf4b-4143-a2b1-7682c7dc2834', false, 'Test message', 'text', 'failed', '2025-08-02 16:53:06.298828', 'wamid.HBgMOTExMjM0NTY3ODkwFQIAERgSRkFDRDhFMTdGOTMyNDI1OUFBAA==', 'outbound', NULL, NULL, '{}', NULL, NULL, '131049', 'This message was not delivered to maintain healthy ecosystem engagement.', '2025-08-02 19:12:28.369', NULL, NULL);
INSERT INTO public.messages VALUES ('3517d897-f57b-4463-b9bc-65573381e339', '4d7fff51-bf4b-4143-a2b1-7682c7dc2834', false, 'Test message after fixes', 'text', 'failed', '2025-08-02 16:59:07.428653', 'wamid.HBgMOTExMjM0NTY3ODkwFQIAERgSODU4RjgzMjhEMTE4N0NBRTc4AA==', 'outbound', NULL, NULL, '{}', NULL, NULL, '131049', 'This message was not delivered to maintain healthy ecosystem engagement.', '2025-08-02 19:12:28.476', NULL, NULL);
INSERT INTO public.messages VALUES ('e7c0bf77-bece-4c8a-99b2-7382975ca0d5', '64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', false, 'Hello! This is a test message from Team Inbox.', 'text', 'failed', '2025-08-02 18:23:55.385844', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSNzAzQ0ExRUM2MjdFNDgwNDkwAA==', 'outbound', NULL, NULL, '{}', NULL, NULL, '131049', 'This message was not delivered to maintain healthy ecosystem engagement.', '2025-08-02 19:12:28.578', NULL, NULL);
INSERT INTO public.messages VALUES ('f33adf42-39f3-43be-8d29-ae8610e8564a', '64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', false, 'Template: welcome', 'text', 'failed', '2025-08-02 18:24:03.821464', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSQjMzRDU5MkM4QjdGRDIyMDNDAA==', 'outbound', NULL, NULL, '{}', NULL, NULL, '131049', 'This message was not delivered to maintain healthy ecosystem engagement.', '2025-08-02 19:12:28.681', NULL, NULL);
INSERT INTO public.messages VALUES ('e960601e-8bc3-4dd4-93bc-8e9062d0f9f6', '9b3b1dd4-d749-451f-a919-72942f0925fc', false, 'test message working', 'text', 'failed', '2025-08-02 18:25:10.712997', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSNTBCOENCNzU2N0NFMjNGOTk3AA==', 'outbound', NULL, NULL, '{}', NULL, NULL, '131049', 'This message was not delivered to maintain healthy ecosystem engagement.', '2025-08-02 19:12:28.783', NULL, NULL);
INSERT INTO public.messages VALUES ('d7a609d1-ba9a-4283-a8ec-d79e6a077a8e', 'c06795ae-aa0f-4f6a-82d2-014baa0a788f', false, 'Template: welcome', 'template', 'delivered', '2025-08-02 17:00:22.143418', 'wamid.HBgMOTE4NDMzMTQ3OTA5FQIAERgSRjZFMEVEMDQwNjlFMjVEMTBCAA==', 'outgoing', NULL, NULL, '{}', '2025-08-02 17:00:27.143', NULL, NULL, NULL, '2025-08-02 19:14:40.286', NULL, NULL);
INSERT INTO public.messages VALUES ('1a12638c-d9bc-4c77-84fa-f40045a41de0', '64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', false, 'Template: welcome', 'template', 'delivered', '2025-08-02 17:29:35.511906', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSQUQ1Q0FFOTFGQjY5QkMwOUI5AA==', 'outgoing', NULL, NULL, '{}', '2025-08-02 17:29:40.511', NULL, NULL, NULL, '2025-08-02 19:14:40.39', NULL, NULL);
INSERT INTO public.messages VALUES ('b86befd1-af9b-49c4-9ea1-061545979bfe', '65dfda53-819a-4baa-b001-e72712ace2a8', false, 'Template: welcome', 'template', 'delivered', '2025-08-02 19:19:56.2364', 'wamid.HBgMOTE5OTkwMTU1OTkzFQIAERgSOUIzNEY2OTlBRjQ0ODFFQUQ3AA==', 'outgoing', NULL, NULL, '{}', '2025-08-02 19:20:01.236', NULL, NULL, NULL, '2025-08-02 19:20:04.234', NULL, NULL);
INSERT INTO public.messages VALUES ('065d4e1c-5a9a-47a8-9bde-33b976c0fd67', '65dfda53-819a-4baa-b001-e72712ace2a8', true, 'Test inbound message from customer', 'text', 'received', '2025-08-02 19:27:38.289814', NULL, 'inbound', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-02 19:27:38.289814', NULL, NULL);
INSERT INTO public.messages VALUES ('a4b9e971-384b-485a-85d0-c7a50b3df1d5', '65dfda53-819a-4baa-b001-e72712ace2a8', false, 'Test failed message', 'text', 'failed', '2025-08-02 19:25:38.289814', NULL, 'outbound', NULL, NULL, '{}', NULL, NULL, '131026', 'Message failed to send due to invalid phone number', '2025-08-02 19:27:38.289814', NULL, NULL);
INSERT INTO public.messages VALUES ('62c65547-68bf-4622-8465-3c6cf60ef3e6', '65dfda53-819a-4baa-b001-e72712ace2a8', false, 'Test message with sent status', 'text', 'sent', '2025-08-02 19:27:34.678861', NULL, 'outbound', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-02 19:28:04.678861', NULL, NULL);
INSERT INTO public.messages VALUES ('9801a141-b2ab-48c8-a581-e5a857a81d91', '9b3b1dd4-d749-451f-a919-72942f0925fc', false, 'ok', 'text', 'delivered', '2025-08-02 20:34:20.453741', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSNEJENEQyMTBFRTgwN0E5NkM2AA==', 'outbound', NULL, NULL, '{}', '2025-08-02 20:34:25.453', NULL, NULL, NULL, '2025-08-02 20:34:26.714', NULL, NULL);
INSERT INTO public.messages VALUES ('a4ffccf1-1a81-4af7-99ed-2e6d63172cc2', '0c288bfd-dfc5-41ac-b18c-b2f64f68aef9', false, 'Template: welcome', 'template', 'failed', '2025-08-03 08:01:40.950761', 'wamid.HBgMOTE4ODgyOTk5MDE1FQIAERgSNDdBRDBFMzQ0NDk4Nzc5MzFFAA==', 'outgoing', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-03 08:01:41.963', '"{\"code\":131049,\"title\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"message\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"errorData\":{\"details\":\"In order to maintain a healthy ecosystem engagement, the message failed to be delivered.\"}}"', NULL);
INSERT INTO public.messages VALUES ('9e217d01-5448-4801-a185-8606cc523687', '64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', false, 'Template: welcome', 'template', 'read', '2025-08-03 08:01:49.810844', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSQjYzRUVFQkU4OTM3NjdDMzY3AA==', 'outgoing', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-03 08:02:02.798', NULL, NULL);
INSERT INTO public.messages VALUES ('7454242e-6c6e-459f-b9a3-23aff5590416', '64b10a9e-b0e6-4d1a-a350-a3d95c8a0c91', false, 'Template: welcome', 'template', 'read', '2025-08-03 08:56:35.50857', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSNjUwRDY4QzY2ODdFMDlGRUY5AA==', 'outgoing', NULL, NULL, '{}', '2025-08-03 08:56:40.508', NULL, NULL, NULL, '2025-08-03 09:04:17.779', NULL, NULL);
INSERT INTO public.messages VALUES ('2c7eda85-2901-4382-b2e0-0715a9164b5f', '0c288bfd-dfc5-41ac-b18c-b2f64f68aef9', false, 'Template: welcome', 'template', 'failed', '2025-08-03 07:37:24.067223', 'wamid.HBgMOTE4ODgyOTk5MDE1FQIAERgSODdFODUwQTYzMDQ0MEI0N0JEAA==', 'outgoing', NULL, NULL, '{}', '2025-08-03 07:37:29.067', NULL, NULL, NULL, '2025-08-03 09:25:14.605', '"{\"code\":131049,\"title\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"message\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"errorData\":{\"details\":\"In order to maintain a healthy ecosystem engagement, the message failed to be delivered.\"}}"', NULL);
INSERT INTO public.messages VALUES ('9b924cf5-3984-4cc4-93fd-60ad3e4bad7e', '0c288bfd-dfc5-41ac-b18c-b2f64f68aef9', false, 'Template: welcome', 'template', 'failed', '2025-08-03 07:43:31.453015', 'wamid.HBgMOTE4ODgyOTk5MDE1FQIAERgSMkI4RTFFNzhDN0EzMjE1MDlCAA==', 'outgoing', NULL, NULL, '{}', '2025-08-03 07:43:36.453', NULL, NULL, NULL, '2025-08-03 09:30:26.356', '"{\"code\":131049,\"title\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"message\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"errorData\":{\"details\":\"In order to maintain a healthy ecosystem engagement, the message failed to be delivered.\"}}"', NULL);
INSERT INTO public.messages VALUES ('25d96c97-6bc9-4605-9568-d2679e1b2398', '9b3b1dd4-d749-451f-a919-72942f0925fc', false, 'hello is chat box working?', 'text', 'received', '2025-08-03 10:59:07.020509', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAEhgWM0VCMEVGOTg5REY5OTlBNDgwMjQ1RgA=', 'inbound', NULL, '2025-08-03 10:59:05', '{}', NULL, NULL, NULL, NULL, '2025-08-03 10:59:07.020509', NULL, NULL);
INSERT INTO public.messages VALUES ('73ed0bb0-43a6-4f35-aec5-7fb1b849d5cb', '9b3b1dd4-d749-451f-a919-72942f0925fc', false, 'yes its working', 'text', 'read', '2025-08-03 10:59:40.498879', 'wamid.HBgMOTE5MzEwNzk3NzAwFQIAERgSQ0ZFNzU1NkUzNDlENEY0MUU4AA==', 'outbound', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-03 10:59:44.786', NULL, NULL);
INSERT INTO public.messages VALUES ('e4a5a143-23fa-4751-8c9c-b5e8df9817fc', 'c52b50b9-7103-4664-9916-66c9b294062b', false, 'Template: welcome', 'template', 'read', '2025-08-04 07:34:52.922995', 'wamid.HBgMOTE4MzY4ODA2NzA4FQIAERgSMTNDRkM2Q0Q4RDVBMEVCMDQ4AA==', 'outgoing', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-04 07:37:27.782', NULL, NULL);
INSERT INTO public.messages VALUES ('dacd9655-18c3-4025-8528-04f4436cc6ff', 'd086423d-1931-41ac-88fe-efd1f49937f1', false, 'Template: welcome', 'template', 'failed', '2025-08-04 12:31:08.082132', 'wamid.HBgMOTE3MDU1NDcyNzY0FQIAERgSMDAzMkY3RkU0NDAwQjUyQTE3AA==', 'outgoing', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-04 12:31:11.343', '"{\"code\":131049,\"title\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"message\":\"This message was not delivered to maintain healthy ecosystem engagement.\",\"errorData\":{\"details\":\"In order to maintain a healthy ecosystem engagement, the message failed to be delivered.\"}}"', NULL);
INSERT INTO public.messages VALUES ('9d156ac4-d44f-4843-969c-8fff209fcbc6', 'fad33c66-3ac2-41ec-ba5c-45db1c910804', false, 'Hi', 'text', 'received', '2025-08-04 12:33:16.897491', 'wamid.HBgMOTE4MzY4ODA2NzA4FQIAEhggRTY3Qjc5RTdDQ0QyMjk4MjEyMkFFNERGRjQ2ODcwRDAA', 'inbound', NULL, '2025-08-04 12:33:13', '{}', NULL, NULL, NULL, NULL, '2025-08-04 12:33:16.897491', NULL, NULL);
INSERT INTO public.messages VALUES ('6f6b3a18-cb67-4ca8-a439-e225c8948d50', 'fad33c66-3ac2-41ec-ba5c-45db1c910804', false, 'Hello', 'text', 'read', '2025-08-04 12:33:50.706071', 'wamid.HBgMOTE4MzY4ODA2NzA4FQIAERgSNjNCRUIxMTExNjM5NzU3NDc5AA==', 'outbound', NULL, NULL, '{}', NULL, NULL, NULL, NULL, '2025-08-04 12:33:58.127', NULL, NULL);


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.session VALUES ('NH0UrhuYO_hPcszFOnspoOolAWndy9Ze', '{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-10T19:35:21.794Z","secure":false,"httpOnly":true,"path":"/"},"user":{"id":"f2e997be-99ce-4de7-a3e5-59363ed118b8","username":"whatsway","email":"admin@whatsway.com","firstName":"Admin","lastName":"User","role":"admin","permissions":["contacts.view","contacts.create","contacts.update","contacts.delete","contacts.export","campaigns.view","campaigns.create","campaigns.update","campaigns.delete","templates.view","templates.create","templates.update","templates.delete","analytics.view","team.view","team.create","team.update","team.delete","settings.view","settings.update","inbox.view","inbox.send","inbox.assign","automations.view","automations.create","automations.update","automations.delete"],"avatar":null}}', '2025-08-10 19:35:29');
INSERT INTO public.session VALUES ('dIcYtXndfwoDDu7pbAG1Bo6afgxc5Fvr', '{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-10T19:42:38.266Z","secure":false,"httpOnly":true,"path":"/"},"user":{"id":"f2e997be-99ce-4de7-a3e5-59363ed118b8","username":"whatsway","email":"admin@whatsway.com","firstName":"Admin","lastName":"User","role":"admin","permissions":["contacts.view","contacts.create","contacts.update","contacts.delete","contacts.export","campaigns.view","campaigns.create","campaigns.update","campaigns.delete","templates.view","templates.create","templates.update","templates.delete","analytics.view","team.view","team.create","team.update","team.delete","settings.view","settings.update","inbox.view","inbox.send","inbox.assign","automations.view","automations.create","automations.update","automations.delete"],"avatar":null}}', '2025-08-10 19:42:44');
INSERT INTO public.session VALUES ('qBmo2FhTHiE2Y8AaypmpUAgN1-CqGI2T', '{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-10T19:46:03.157Z","secure":false,"httpOnly":true,"path":"/"},"user":{"id":"f2e997be-99ce-4de7-a3e5-59363ed118b8","username":"whatsway","email":"admin@whatsway.com","firstName":"Admin","lastName":"User","role":"admin","permissions":["contacts.view","contacts.create","contacts.update","contacts.delete","contacts.export","campaigns.view","campaigns.create","campaigns.update","campaigns.delete","templates.view","templates.create","templates.update","templates.delete","analytics.view","team.view","team.create","team.update","team.delete","settings.view","settings.update","inbox.view","inbox.send","inbox.assign","automations.view","automations.create","automations.update","automations.delete"],"avatar":null}}', '2025-08-13 06:57:21');


--
-- Data for Name: team_activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.templates VALUES ('5162d7f8-96f0-4789-813b-672d23614697', 'welcome_msg_1', 'MARKETING', 'en_US', 'Welcome to test', 'This is a template approval test via api', '', '[]', '[]', 'APPROVED', 0, '2025-08-03 10:58:03.187695', 'f8e8f949-a099-47e7-a999-94774a6890ab', 'text', NULL, NULL, '[]', '1902546353859651', '2025-08-03 10:58:03.187695', NULL);
INSERT INTO public.templates VALUES ('eca1e1de-5c46-4228-b58e-77bada69b67b', 'new_product_launch', 'MARKETING', 'en_US', NULL, 'Hello {{1}},

Exciting news! 🚀 Diploy has launched a WhatsApp automation platform for your business.

Key features:
• Send bulk messages & broadcasts
• Manage multiple WhatsApp numbers (channels)
• Team inbox for easy collaboration
• Powerful automation & auto-replies
• Detailed campaign analytics

Automate your customer engagement and grow faster—all in one place!

Reply *YES* for more info or a free demo.', NULL, '[]', '[]', 'REJECTED', 0, '2025-08-03 10:58:35.908826', 'f8e8f949-a099-47e7-a999-94774a6890ab', 'text', NULL, NULL, '[]', '2173229023089341', '2025-08-03 10:58:35.908826', NULL);
INSERT INTO public.templates VALUES ('7f2d0e3f-4f2a-4ff3-8a39-d158c34820e1', 'order_confirmation', 'utility', 'en', NULL, 'Hi {{1}}, your order #{{2}} has been confirmed and will be delivered by {{3}}.', NULL, '[]', '[]', 'pending', 0, '2025-08-02 16:40:02.948367', 'b74ab99e-543c-4781-be8e-e5524973eb0f', 'text', NULL, NULL, '[]', NULL, '2025-08-02 16:40:02.948367', NULL);
INSERT INTO public.templates VALUES ('8824aeb5-eb86-4ba9-bd4d-cca4e353b3c9', 'hello_world', 'utility', 'en', NULL, 'Hello {{1}}! Welcome to our WhatsApp Business platform.', NULL, '[]', '[]', 'pending', 0, '2025-08-02 16:40:02.942223', 'b74ab99e-543c-4781-be8e-e5524973eb0f', 'text', NULL, NULL, '[]', NULL, '2025-08-02 16:40:02.942223', NULL);
INSERT INTO public.templates VALUES ('d892343f-8e73-411e-8de3-133cff537ee3', 'appointment_reminder', 'utility', 'en', NULL, 'Hello {{1}}, this is a reminder about your appointment on {{2}} at {{3}}. Reply YES to confirm.', NULL, '[]', '[]', 'pending', 0, '2025-08-02 16:40:02.956698', 'b74ab99e-543c-4781-be8e-e5524973eb0f', 'text', NULL, NULL, '[]', NULL, '2025-08-02 16:40:02.956698', NULL);
INSERT INTO public.templates VALUES ('da0d30d1-6f56-477d-bce1-4d60c7e79f1b', 'welcome', 'MARKETING', 'en_US', 'Hello everyone ', 'This is automated template testing message.

regards
diploy', 'Test completed', '[]', '[]', 'APPROVED', 0, '2025-08-02 13:21:47.732053', 'f8e8f949-a099-47e7-a999-94774a6890ab', 'text', NULL, NULL, '[]', '731268309657517', '2025-08-02 13:21:47.732053', NULL);
INSERT INTO public.templates VALUES ('cd724ee0-c5e6-4406-af46-289043f48aef', 'whatsway_offer', 'MARKETING', 'en_US', 'Whatsapp has arrived!', 'Hello {{1}},

Exciting news! 🚀 Diploy has launched a WhatsApp automation platform for your business.

Key features:
• Send bulk messages & broadcasts
• Manage multiple WhatsApp numbers (channels)
• Team inbox for easy collaboration
• Powerful automation & auto-replies
• Detailed campaign analytics

Automate your customer engagement and grow faster—all in one place!

Reply *YES* for more info or a free demo.', '', '[]', '[]', 'REJECTED', 0, '2025-08-03 10:33:55.970831', 'f8e8f949-a099-47e7-a999-94774a6890ab', 'text', NULL, NULL, '[]', '1148290790469369', '2025-08-03 10:33:55.970831', NULL);
INSERT INTO public.templates VALUES ('27bec092-b909-437f-8cd2-e1052fd4d01e', 'hello_world', 'UTILITY', 'en_US', NULL, 'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.', NULL, '[]', '[]', 'APPROVED', 0, '2025-08-03 10:44:56.798859', 'f8e8f949-a099-47e7-a999-94774a6890ab', 'text', NULL, NULL, '[]', '1472662310833877', '2025-08-03 10:44:56.798859', NULL);
INSERT INTO public.templates VALUES ('2c21e625-b20f-4ebb-bf97-76f3af055ba4', 'astropro_1', 'MARKETING', 'en_US', 'Launch your Astrology Consultation App', 'Hello {{1}},

Exciting news for astrology enthusiasts! ✨

We’ve just launched our Astrology Consultation App—your personal guide for instant astrological advice and expert consultations.

Key features:
• Connect with certified astrologers
• Chat or call for real-time guidance
• Personalized horoscope & reports
• Daily tips, remedies & more

Unlock your destiny with trusted experts—all in one app!

Reply *ASTRO* to get a free trial or more details.', '', '[]', '[]', 'REJECTED', 0, '2025-08-03 10:48:11.647393', 'f8e8f949-a099-47e7-a999-94774a6890ab', 'text', NULL, NULL, '[]', '1494833015018919', '2025-08-03 10:48:11.647393', NULL);


--
-- Data for Name: user_activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_activity_logs VALUES ('cebfd198-f79b-4ead-aa3d-552f11936bd0', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', 'login', 'user', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', '{"ipAddress": "127.0.0.1", "userAgent": "curl/8.14.1"}', '127.0.0.1', 'curl/8.14.1', '2025-08-03 19:35:21.733447');
INSERT INTO public.user_activity_logs VALUES ('9f4a5117-90aa-4e02-9ef1-bfdad07513a1', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', 'login', 'user', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', '{"ipAddress": "127.0.0.1", "userAgent": "curl/8.14.1"}', '127.0.0.1', 'curl/8.14.1', '2025-08-03 19:39:56.822111');
INSERT INTO public.user_activity_logs VALUES ('f253c5ce-8253-44b8-87ad-62ccadce8673', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', 'logout', 'user', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', '{}', NULL, NULL, '2025-08-03 19:40:27.683903');
INSERT INTO public.user_activity_logs VALUES ('c257434d-cbd1-43e6-9743-6c7ee5a8c947', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', 'login', 'user', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', '{"ipAddress": "127.0.0.1", "userAgent": "curl/8.14.1"}', '127.0.0.1', 'curl/8.14.1', '2025-08-03 19:42:38.205436');
INSERT INTO public.user_activity_logs VALUES ('2d0d7915-3cab-481c-b12f-116759ac7ae8', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', 'login', 'user', 'f2e997be-99ce-4de7-a3e5-59363ed118b8', '{"ipAddress": "172.31.106.130", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', '172.31.106.130', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-03 19:46:03.105533');


--
-- Data for Name: webhook_configs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.webhook_configs VALUES ('f83aa67a-c5e2-4d0e-aa73-681a263cd009', NULL, 'https://d6a63d6e-5577-4d02-80b7-0b54ffbd5ab5-00-3ci9wfzjd76hb.worf.replit.dev/webhook/d420e261-9c12-4cee-9d65-253cda8ab4bc', '#!rgjTTrb!aaG4ZvPw!GA5vZCKyvmh&N', '', '["messages", "message_status", "message_template_status_update", "message_reads", "message_reactions", "phone_number_name_update", "account_update", "security"]', true, '2025-08-04 12:33:57.82', '2025-08-02 14:54:31.682805');


--
-- PostgreSQL database dump complete
--

