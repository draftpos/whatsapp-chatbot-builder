CREATE TABLE "automation_edges" (
	"id" varchar PRIMARY KEY NOT NULL,
	"automation_id" varchar NOT NULL,
	"source_node_id" varchar NOT NULL,
	"target_node_id" varchar NOT NULL,
	"animated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "automation_edges_unique_idx" UNIQUE("automation_id","source_node_id","target_node_id")
);
--> statement-breakpoint
ALTER TABLE "automation_nodes" ADD COLUMN "measured" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "automation_edges" ADD CONSTRAINT "automation_edges_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_edges" ADD CONSTRAINT "automation_edges_source_node_id_automation_nodes_node_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."automation_nodes"("node_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_edges" ADD CONSTRAINT "automation_edges_target_node_id_automation_nodes_node_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."automation_nodes"("node_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_edges_automation_idx" ON "automation_edges" USING btree ("automation_id");