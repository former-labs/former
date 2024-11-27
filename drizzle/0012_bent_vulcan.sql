CREATE TABLE IF NOT EXISTS "dashboard_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"grid_x" integer NOT NULL,
	"grid_y" integer NOT NULL,
	"grid_width" integer NOT NULL,
	"grid_height" integer NOT NULL,
	"plot_view_id" uuid NOT NULL,
	"google_analytics_report_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_item" ADD CONSTRAINT "dashboard_item_dashboard_id_dashboard_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_item" ADD CONSTRAINT "dashboard_item_plot_view_id_plot_view_id_fk" FOREIGN KEY ("plot_view_id") REFERENCES "public"."plot_view"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_item" ADD CONSTRAINT "dashboard_item_google_analytics_report_id_google_analytics_report_id_fk" FOREIGN KEY ("google_analytics_report_id") REFERENCES "public"."google_analytics_report"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
