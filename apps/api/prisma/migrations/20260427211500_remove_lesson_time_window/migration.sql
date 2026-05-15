DROP TRIGGER IF EXISTS "lessons_require_enabled_group_settings_trigger" ON "lessons";
DROP TRIGGER IF EXISTS "schedule_events_require_enabled_group_settings_trigger" ON "schedule_events";

CREATE OR REPLACE FUNCTION "assert_schedule_event_is_standalone"(
  target_group_id UUID,
  target_title TEXT,
  target_starts_at TIMESTAMPTZ,
  target_ends_at TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "assignments"
    WHERE "group_id" = target_group_id
      AND "title" = target_title
      AND "due_at" IS NOT NULL
      AND "due_at" = target_starts_at
      AND "due_at" = target_ends_at
  ) THEN
    RAISE EXCEPTION 'Schedule event duplicates assignment-derived schedule entry for group %', target_group_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "trg_assert_lesson_constraints"()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM "assert_lessons_enabled"(NEW."group_id");

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "schedule_events_require_enabled_group_settings_trigger"
AFTER INSERT OR UPDATE OF "group_id", "title", "starts_at", "ends_at" ON "schedule_events"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_schedule_event_constraints"();

CREATE CONSTRAINT TRIGGER "lessons_require_enabled_group_settings_trigger"
AFTER INSERT OR UPDATE OF "group_id" ON "lessons"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_lesson_constraints"();

DROP FUNCTION IF EXISTS "assert_no_schedule_event_matches_lesson"(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ);

DROP INDEX IF EXISTS "lessons_group_id_starts_at_idx";

ALTER TABLE "lessons"
DROP COLUMN IF EXISTS "starts_at",
DROP COLUMN IF EXISTS "ends_at";
