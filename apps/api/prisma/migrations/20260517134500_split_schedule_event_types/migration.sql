ALTER TABLE "group_settings"
ADD COLUMN "schedule_weekly_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "schedule_special_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "ScheduleEventType" AS ENUM ('SPECIAL', 'WEEKLY');

ALTER TABLE "schedule_events"
ADD COLUMN "event_type" "ScheduleEventType" NOT NULL DEFAULT 'SPECIAL',
ADD COLUMN "weekday" SMALLINT,
ADD COLUMN "start_minutes" SMALLINT,
ADD COLUMN "end_minutes" SMALLINT;

CREATE INDEX "schedule_events_group_id_event_type_weekday_start_minutes_idx" ON "schedule_events"("group_id", "event_type", "weekday", "start_minutes");

ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_type_shape_check" CHECK (
  ("event_type" = 'SPECIAL' AND "weekday" IS NULL AND "start_minutes" IS NULL AND "end_minutes" IS NULL)
  OR
  ("event_type" = 'WEEKLY' AND "weekday" BETWEEN 1 AND 7 AND "start_minutes" BETWEEN 0 AND 1439 AND "end_minutes" BETWEEN 1 AND 1440 AND "end_minutes" > "start_minutes")
);
