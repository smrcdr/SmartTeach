CREATE OR REPLACE FUNCTION "assert_lessons_enabled"(target_group_id UUID)
RETURNS VOID AS $$
DECLARE
  feature_enabled BOOLEAN;
BEGIN
  IF target_group_id IS NULL THEN
    RETURN;
  END IF;

  SELECT "lessons_enabled"
  INTO feature_enabled
  FROM "group_settings"
  WHERE "group_id" = target_group_id;

  IF feature_enabled IS NULL THEN
    RETURN;
  END IF;

  IF NOT feature_enabled THEN
    RAISE EXCEPTION 'Group % has lessons_enabled disabled', target_group_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "assert_assignments_enabled"(target_group_id UUID)
RETURNS VOID AS $$
DECLARE
  feature_enabled BOOLEAN;
BEGIN
  IF target_group_id IS NULL THEN
    RETURN;
  END IF;

  SELECT "assignments_enabled"
  INTO feature_enabled
  FROM "group_settings"
  WHERE "group_id" = target_group_id;

  IF feature_enabled IS NULL THEN
    RETURN;
  END IF;

  IF NOT feature_enabled THEN
    RAISE EXCEPTION 'Group % has assignments_enabled disabled', target_group_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "assert_schedule_enabled"(target_group_id UUID)
RETURNS VOID AS $$
DECLARE
  feature_enabled BOOLEAN;
BEGIN
  IF target_group_id IS NULL THEN
    RETURN;
  END IF;

  SELECT "schedule_enabled"
  INTO feature_enabled
  FROM "group_settings"
  WHERE "group_id" = target_group_id;

  IF feature_enabled IS NULL THEN
    RETURN;
  END IF;

  IF NOT feature_enabled THEN
    RAISE EXCEPTION 'Group % has schedule_enabled disabled', target_group_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "assert_no_schedule_event_matches_lesson"(
  target_group_id UUID,
  target_title TEXT,
  target_starts_at TIMESTAMPTZ,
  target_ends_at TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  IF target_group_id IS NULL
    OR target_title IS NULL
    OR target_starts_at IS NULL
    OR target_ends_at IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "schedule_events"
    WHERE "group_id" = target_group_id
      AND "title" = target_title
      AND "starts_at" = target_starts_at
      AND "ends_at" = target_ends_at
  ) THEN
    RAISE EXCEPTION 'Lesson-derived schedule entry for group % is duplicated in schedule_events', target_group_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "assert_no_schedule_event_matches_assignment"(
  target_group_id UUID,
  target_title TEXT,
  target_due_at TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  IF target_group_id IS NULL
    OR target_title IS NULL
    OR target_due_at IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "schedule_events"
    WHERE "group_id" = target_group_id
      AND "title" = target_title
      AND "starts_at" = target_due_at
      AND "ends_at" = target_due_at
  ) THEN
    RAISE EXCEPTION 'Assignment-derived schedule entry for group % is duplicated in schedule_events', target_group_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

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
    FROM "lessons"
    WHERE "group_id" = target_group_id
      AND "title" = target_title
      AND "starts_at" = target_starts_at
      AND "ends_at" = target_ends_at
  ) THEN
    RAISE EXCEPTION 'Schedule event duplicates lesson-derived schedule entry for group %', target_group_id
      USING ERRCODE = '23514';
  END IF;

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
  PERFORM "assert_no_schedule_event_matches_lesson"(
    NEW."group_id",
    NEW."title",
    NEW."starts_at",
    NEW."ends_at"
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "trg_assert_assignment_constraints"()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM "assert_assignments_enabled"(NEW."group_id");
  PERFORM "assert_no_schedule_event_matches_assignment"(
    NEW."group_id",
    NEW."title",
    NEW."due_at"
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "trg_assert_schedule_event_constraints"()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM "assert_schedule_enabled"(NEW."group_id");
  PERFORM "assert_schedule_event_is_standalone"(
    NEW."group_id",
    NEW."title",
    NEW."starts_at",
    NEW."ends_at"
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "schedule_events_require_enabled_group_settings_trigger"
AFTER INSERT OR UPDATE OF "group_id", "title", "starts_at", "ends_at" ON "schedule_events"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_schedule_event_constraints"();

CREATE CONSTRAINT TRIGGER "lessons_require_enabled_group_settings_trigger"
AFTER INSERT OR UPDATE OF "group_id", "title", "starts_at", "ends_at" ON "lessons"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_lesson_constraints"();

CREATE CONSTRAINT TRIGGER "assignments_require_enabled_group_settings_trigger"
AFTER INSERT OR UPDATE OF "group_id", "title", "due_at" ON "assignments"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_assignment_constraints"();
