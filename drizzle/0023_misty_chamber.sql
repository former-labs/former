ALTER TABLE "conversation" DROP CONSTRAINT "conversation_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "database_metadata" DROP CONSTRAINT "database_metadata_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "instructions" DROP CONSTRAINT "instructions_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "knowledge" DROP CONSTRAINT "knowledge_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "message_item" DROP CONSTRAINT "message_item_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "message_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "role" DROP CONSTRAINT "role_workspace_id_workspace_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "database_metadata" ADD CONSTRAINT "database_metadata_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instructions" ADD CONSTRAINT "instructions_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge" ADD CONSTRAINT "knowledge_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_item" ADD CONSTRAINT "message_item_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role" ADD CONSTRAINT "role_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
