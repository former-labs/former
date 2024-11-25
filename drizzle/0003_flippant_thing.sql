CREATE TABLE IF NOT EXISTS "google_analytics_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"report_parameters" json NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "google_analytics_report_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_google_analytics_report_id_google_analytics_report_id_fk" FOREIGN KEY ("google_analytics_report_id") REFERENCES "public"."google_analytics_report"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
