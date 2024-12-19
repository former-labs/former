CREATE TABLE IF NOT EXISTS "knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"query" text NOT NULL
);
ALTER TABLE "message_item" DROP CONSTRAINT "message_item_google_analytics_report_id_google_analytics_report_id_fk";
--> statement-breakpoint
ALTER TABLE "message_item" DROP CONSTRAINT "message_item_plot_view_id_plot_view_id_fk";
--> statement-breakpoint
--> statement-breakpoint
DROP TABLE "dashboard_item";--> statement-breakpoint
DROP TABLE "dashboard";--> statement-breakpoint
DROP TABLE "google_analytics_report";--> statement-breakpoint
DROP TABLE "integration";--> statement-breakpoint
DROP TABLE "plot_view";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge" ADD CONSTRAINT "knowledge_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "message_item" DROP COLUMN IF EXISTS "google_analytics_report_id";--> statement-breakpoint
ALTER TABLE "message_item" DROP COLUMN IF EXISTS "plot_view_id";