ALTER TABLE "database_metadata" RENAME TO "integration";--> statement-breakpoint
ALTER TABLE "integration" DROP CONSTRAINT "database_metadata_workspace_id_unique";--> statement-breakpoint
ALTER TABLE "integration" DROP CONSTRAINT "database_metadata_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "integration" ALTER COLUMN "database_metadata" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "integration" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge" ADD COLUMN "integration_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration" ADD CONSTRAINT "integration_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge" ADD CONSTRAINT "knowledge_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "integration" ADD CONSTRAINT "integration_workspace_id_unique" UNIQUE("workspace_id");