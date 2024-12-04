CREATE TABLE IF NOT EXISTS "message_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_id" uuid NOT NULL,
	"google_analytics_report_id" uuid,
	"plot_view_id" uuid
);
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "message_google_analytics_report_id_google_analytics_report_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "message_plot_view_id_plot_view_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_item" ADD CONSTRAINT "message_item_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_item" ADD CONSTRAINT "message_item_google_analytics_report_id_google_analytics_report_id_fk" FOREIGN KEY ("google_analytics_report_id") REFERENCES "public"."google_analytics_report"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_item" ADD CONSTRAINT "message_item_plot_view_id_plot_view_id_fk" FOREIGN KEY ("plot_view_id") REFERENCES "public"."plot_view"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "message_item" ("message_id", "google_analytics_report_id", "plot_view_id")
SELECT 
  "id" as "message_id",
  "google_analytics_report_id",
  "plot_view_id"
FROM "message" 
WHERE "google_analytics_report_id" IS NOT NULL OR "plot_view_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN IF EXISTS "google_analytics_report_id";
--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN IF EXISTS "plot_view_id";
