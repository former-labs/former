-- Add workspace_id as nullable initially
ALTER TABLE "message_item" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "message_item" ADD CONSTRAINT "message_item_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Update workspace_id from parent message
UPDATE "message_item" mi
SET workspace_id = m.workspace_id
FROM "message" m
WHERE mi.message_id = m.id;

-- Make workspace_id not nullable
ALTER TABLE "message_item" ALTER COLUMN "workspace_id" SET NOT NULL;
