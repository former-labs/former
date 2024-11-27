ALTER TABLE "user" ADD COLUMN "supabase_auth_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "clerk_auth_id";