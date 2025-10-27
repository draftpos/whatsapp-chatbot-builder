ALTER TABLE "api_logs" DROP CONSTRAINT "api_logs_channel_id_whatsapp_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;