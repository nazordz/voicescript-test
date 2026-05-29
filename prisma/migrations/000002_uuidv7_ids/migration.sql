ALTER TABLE "job_status_histories" DROP CONSTRAINT "job_status_histories_job_id_fkey";
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_reporter_id_fkey";
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_editor_id_fkey";

ALTER TABLE "reporters" ADD COLUMN "id_uuid" UUID NOT NULL DEFAULT uuidv7();
ALTER TABLE "editors" ADD COLUMN "id_uuid" UUID NOT NULL DEFAULT uuidv7();
ALTER TABLE "jobs" ADD COLUMN "id_uuid" UUID NOT NULL DEFAULT uuidv7();
ALTER TABLE "job_status_histories" ADD COLUMN "id_uuid" UUID NOT NULL DEFAULT uuidv7();

ALTER TABLE "jobs" ADD COLUMN "reporter_id_uuid" UUID;
ALTER TABLE "jobs" ADD COLUMN "editor_id_uuid" UUID;
ALTER TABLE "job_status_histories" ADD COLUMN "job_id_uuid" UUID;

UPDATE "jobs"
SET "reporter_id_uuid" = "reporters"."id_uuid"
FROM "reporters"
WHERE "jobs"."reporter_id" = "reporters"."id";

UPDATE "jobs"
SET "editor_id_uuid" = "editors"."id_uuid"
FROM "editors"
WHERE "jobs"."editor_id" = "editors"."id";

UPDATE "job_status_histories"
SET "job_id_uuid" = "jobs"."id_uuid"
FROM "jobs"
WHERE "job_status_histories"."job_id" = "jobs"."id";

ALTER TABLE "job_status_histories" ALTER COLUMN "job_id_uuid" SET NOT NULL;

ALTER TABLE "job_status_histories" DROP CONSTRAINT "job_status_histories_pkey";
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_pkey";
ALTER TABLE "editors" DROP CONSTRAINT "editors_pkey";
ALTER TABLE "reporters" DROP CONSTRAINT "reporters_pkey";

ALTER TABLE "jobs" DROP COLUMN "reporter_id";
ALTER TABLE "jobs" DROP COLUMN "editor_id";
ALTER TABLE "job_status_histories" DROP COLUMN "job_id";

ALTER TABLE "reporters" DROP COLUMN "id";
ALTER TABLE "editors" DROP COLUMN "id";
ALTER TABLE "jobs" DROP COLUMN "id";
ALTER TABLE "job_status_histories" DROP COLUMN "id";

ALTER TABLE "reporters" RENAME COLUMN "id_uuid" TO "id";
ALTER TABLE "editors" RENAME COLUMN "id_uuid" TO "id";
ALTER TABLE "jobs" RENAME COLUMN "id_uuid" TO "id";
ALTER TABLE "job_status_histories" RENAME COLUMN "id_uuid" TO "id";

ALTER TABLE "jobs" RENAME COLUMN "reporter_id_uuid" TO "reporter_id";
ALTER TABLE "jobs" RENAME COLUMN "editor_id_uuid" TO "editor_id";
ALTER TABLE "job_status_histories" RENAME COLUMN "job_id_uuid" TO "job_id";

ALTER TABLE "reporters" ADD CONSTRAINT "reporters_pkey" PRIMARY KEY ("id");
ALTER TABLE "editors" ADD CONSTRAINT "editors_pkey" PRIMARY KEY ("id");
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");
ALTER TABLE "job_status_histories" ADD CONSTRAINT "job_status_histories_pkey" PRIMARY KEY ("id");

CREATE INDEX "jobs_reporter_id_idx" ON "jobs"("reporter_id");
CREATE INDEX "jobs_editor_id_idx" ON "jobs"("editor_id");
CREATE INDEX "job_status_histories_job_id_idx" ON "job_status_histories"("job_id");

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_reporter_id_fkey"
  FOREIGN KEY ("reporter_id") REFERENCES "reporters"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_editor_id_fkey"
  FOREIGN KEY ("editor_id") REFERENCES "editors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_status_histories"
  ADD CONSTRAINT "job_status_histories_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
