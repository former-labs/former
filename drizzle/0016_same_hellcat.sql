ALTER TABLE "integration" ALTER COLUMN "workspace_id" SET DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555';--> statement-breakpoint
ALTER TABLE "role" ALTER COLUMN "workspace_id" SET DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555';--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "workspace_id" uuid DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_item" ADD COLUMN "workspace_id" uuid DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard" ADD COLUMN "workspace_id" uuid DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555' NOT NULL;--> statement-breakpoint
ALTER TABLE "google_analytics_report" ADD COLUMN "workspace_id" uuid DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555' NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "workspace_id" uuid DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555' NOT NULL;--> statement-breakpoint
ALTER TABLE "plot_view" ADD COLUMN "workspace_id" uuid DEFAULT '9fd5244f-9091-4199-b2d7-cd30fe1c8555' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_item" ADD CONSTRAINT "dashboard_item_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard" ADD CONSTRAINT "dashboard_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "google_analytics_report" ADD CONSTRAINT "google_analytics_report_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plot_view" ADD CONSTRAINT "plot_view_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
