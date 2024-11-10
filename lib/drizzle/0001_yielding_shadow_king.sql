CREATE TABLE IF NOT EXISTS "embedding" (
	"id" uuid,
	"content" text,
	"embedding" vector(1024)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"metadata" jsonb,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "embedding" ADD CONSTRAINT "embedding_id_resource_id_fk" FOREIGN KEY ("id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resource" ADD CONSTRAINT "resource_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_embedding_idx" ON "embedding" USING hnsw ("embedding" vector_cosine_ops);