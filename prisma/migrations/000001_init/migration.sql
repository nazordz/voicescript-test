CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "reporters" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "availability" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reporters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "editors" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "availability" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "editors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jobs" (
  "id" SERIAL NOT NULL,
  "case_name" TEXT NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "location" TEXT NOT NULL,
  "status" SMALLINT NOT NULL DEFAULT 0,
  "reporter_id" INTEGER,
  "editor_id" INTEGER,
  "is_remote" BOOLEAN NOT NULL DEFAULT false,
  "reporter_rate_idr" INTEGER NOT NULL DEFAULT 2000,
  "editor_fee_idr" INTEGER NOT NULL DEFAULT 50000,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_status_histories" (
  "id" SERIAL NOT NULL,
  "job_id" INTEGER NOT NULL,
  "from_status" SMALLINT,
  "to_status" SMALLINT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "job_status_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reporters_name_idx" ON "reporters"("name");
CREATE INDEX "reporters_location_idx" ON "reporters"("location");
CREATE INDEX "reporters_availability_idx" ON "reporters"("availability");

CREATE INDEX "editors_name_idx" ON "editors"("name");
CREATE INDEX "editors_availability_idx" ON "editors"("availability");

CREATE INDEX "jobs_case_name_idx" ON "jobs"("case_name");
CREATE INDEX "jobs_status_idx" ON "jobs"("status");
CREATE INDEX "jobs_location_idx" ON "jobs"("location");
CREATE INDEX "jobs_is_remote_idx" ON "jobs"("is_remote");
CREATE INDEX "jobs_reporter_id_idx" ON "jobs"("reporter_id");
CREATE INDEX "jobs_editor_id_idx" ON "jobs"("editor_id");

CREATE INDEX "job_status_histories_job_id_idx" ON "job_status_histories"("job_id");
CREATE INDEX "job_status_histories_created_at_idx" ON "job_status_histories"("created_at");

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
