CREATE TABLE IF NOT EXISTS "database_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"database_metadata" jsonb NOT NULL,
	CONSTRAINT "database_metadata_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "database_metadata" ADD CONSTRAINT "database_metadata_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
