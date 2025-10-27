CREATE TABLE "panel_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"tagline" varchar,
	"description" text,
	"logo" varchar,
	"favicon" varchar,
	"default_language" varchar(5) DEFAULT 'en',
	"supported_languages" jsonb DEFAULT '["en"]',
	"company_name" varchar,
	"company_website" varchar,
	"support_email" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
