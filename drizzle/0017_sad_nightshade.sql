ALTER TABLE "conversation" ALTER COLUMN "workspace_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dashboard_item" ALTER COLUMN "workspace_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dashboard" ALTER COLUMN "workspace_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "google_analytics_report" ALTER COLUMN "workspace_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "integration" ALTER COLUMN "workspace_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "workspace_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "plot_view" ALTER COLUMN "workspace_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "role" ALTER COLUMN "workspace_id" DROP DEFAULT;