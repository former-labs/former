ALTER TABLE "message" ADD COLUMN "plot_view_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_plot_view_id_plot_view_id_fk" FOREIGN KEY ("plot_view_id") REFERENCES "public"."plot_view"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
