ALTER TABLE "embedding" DROP CONSTRAINT "embedding_id_resource_id_fk";
--> statement-breakpoint
ALTER TABLE "embedding" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "embedding" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "embedding" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "embedding" ADD COLUMN "resourceId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "embedding" ADD CONSTRAINT "embedding_resourceId_resource_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
