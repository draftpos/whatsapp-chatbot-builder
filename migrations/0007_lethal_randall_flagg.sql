ALTER TABLE "messages" ADD COLUMN "media_id" varchar;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_sha256" varchar(128);