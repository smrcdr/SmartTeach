DROP TRIGGER IF EXISTS "assignments_require_same_group_lesson_trigger" ON "assignments";
DROP TRIGGER IF EXISTS "assignments_require_same_group_material_targets_trigger" ON "assignments";

ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_single_material_target_check";

CREATE TABLE "assignment_lesson_targets" (
  "assignment_id" UUID NOT NULL,
  "lesson_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "attached_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assignment_lesson_targets_pkey" PRIMARY KEY ("assignment_id", "lesson_id")
);

CREATE TABLE "assignment_material_section_targets" (
  "assignment_id" UUID NOT NULL,
  "material_section_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "attached_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assignment_material_section_targets_pkey" PRIMARY KEY ("assignment_id", "material_section_id")
);

CREATE TABLE "assignment_material_subsection_targets" (
  "assignment_id" UUID NOT NULL,
  "material_subsection_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "attached_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assignment_material_subsection_targets_pkey" PRIMARY KEY ("assignment_id", "material_subsection_id")
);

CREATE INDEX "assignment_lesson_targets_lesson_id_idx" ON "assignment_lesson_targets"("lesson_id");
CREATE INDEX "assignment_material_section_targets_material_section_id_idx" ON "assignment_material_section_targets"("material_section_id");
CREATE INDEX "assignment_material_subsection_targets_material_subsection_id_idx" ON "assignment_material_subsection_targets"("material_subsection_id");

ALTER TABLE "assignment_lesson_targets" ADD CONSTRAINT "assignment_lesson_targets_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_lesson_targets" ADD CONSTRAINT "assignment_lesson_targets_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assignment_material_section_targets" ADD CONSTRAINT "assignment_material_section_targets_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_material_section_targets" ADD CONSTRAINT "assignment_material_section_targets_material_section_id_fkey" FOREIGN KEY ("material_section_id") REFERENCES "material_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assignment_material_subsection_targets" ADD CONSTRAINT "assignment_material_subsection_targets_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_material_subsection_targets" ADD CONSTRAINT "assignment_material_subsection_targets_material_subsection_id_fkey" FOREIGN KEY ("material_subsection_id") REFERENCES "material_subsections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "assignment_lesson_targets" ("assignment_id", "lesson_id", "sort_order", "attached_at")
SELECT "id", "lesson_id", 1, COALESCE("updated_at", CURRENT_TIMESTAMP)
FROM "assignments"
WHERE "lesson_id" IS NOT NULL;

INSERT INTO "assignment_material_section_targets" ("assignment_id", "material_section_id", "sort_order", "attached_at")
SELECT "id", "material_section_id", 1, COALESCE("updated_at", CURRENT_TIMESTAMP)
FROM "assignments"
WHERE "material_section_id" IS NOT NULL;

INSERT INTO "assignment_material_subsection_targets" ("assignment_id", "material_subsection_id", "sort_order", "attached_at")
SELECT "id", "material_subsection_id", 1, COALESCE("updated_at", CURRENT_TIMESTAMP)
FROM "assignments"
WHERE "material_subsection_id" IS NOT NULL;

DROP INDEX IF EXISTS "assignments_lesson_id_idx";
DROP INDEX IF EXISTS "assignments_material_section_id_idx";
DROP INDEX IF EXISTS "assignments_material_subsection_id_idx";

ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_lesson_id_fkey";
ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_material_section_id_fkey";
ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_material_subsection_id_fkey";

ALTER TABLE "assignments"
DROP COLUMN IF EXISTS "lesson_id",
DROP COLUMN IF EXISTS "material_section_id",
DROP COLUMN IF EXISTS "material_subsection_id";

DROP FUNCTION IF EXISTS "enforce_assignment_lesson_group_match"();
DROP FUNCTION IF EXISTS "enforce_assignment_material_target_group_match"();

CREATE OR REPLACE FUNCTION "enforce_assignment_lesson_target_group_match"()
RETURNS TRIGGER AS $$
DECLARE
  assignment_group_id UUID;
  lesson_group_id UUID;
BEGIN
  SELECT "group_id"
  INTO assignment_group_id
  FROM "assignments"
  WHERE "id" = NEW."assignment_id";

  SELECT "group_id"
  INTO lesson_group_id
  FROM "lessons"
  WHERE "id" = NEW."lesson_id";

  IF assignment_group_id IS NULL OR lesson_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF assignment_group_id <> lesson_group_id THEN
    RAISE EXCEPTION 'Assignment lesson % must belong to group %', NEW."lesson_id", assignment_group_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_assignment_material_section_target_group_match"()
RETURNS TRIGGER AS $$
DECLARE
  assignment_group_id UUID;
  section_group_id UUID;
BEGIN
  SELECT "group_id"
  INTO assignment_group_id
  FROM "assignments"
  WHERE "id" = NEW."assignment_id";

  SELECT "group_id"
  INTO section_group_id
  FROM "material_sections"
  WHERE "id" = NEW."material_section_id";

  IF assignment_group_id IS NULL OR section_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF assignment_group_id <> section_group_id THEN
    RAISE EXCEPTION 'Assignment material section % must belong to group %', NEW."material_section_id", assignment_group_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_assignment_material_subsection_target_group_match"()
RETURNS TRIGGER AS $$
DECLARE
  assignment_group_id UUID;
  subsection_group_id UUID;
BEGIN
  SELECT "group_id"
  INTO assignment_group_id
  FROM "assignments"
  WHERE "id" = NEW."assignment_id";

  SELECT "group_id"
  INTO subsection_group_id
  FROM "material_subsections"
  WHERE "id" = NEW."material_subsection_id";

  IF assignment_group_id IS NULL OR subsection_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF assignment_group_id <> subsection_group_id THEN
    RAISE EXCEPTION 'Assignment material subsection % must belong to group %', NEW."material_subsection_id", assignment_group_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_assignment_targets_group_match"()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "assignment_lesson_targets" AS target
    JOIN "lessons" AS lesson ON lesson."id" = target."lesson_id"
    WHERE target."assignment_id" = NEW."id"
      AND lesson."group_id" <> NEW."group_id"
  ) THEN
    RAISE EXCEPTION 'Assignment lesson targets must belong to group %', NEW."group_id"
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "assignment_material_section_targets" AS target
    JOIN "material_sections" AS section ON section."id" = target."material_section_id"
    WHERE target."assignment_id" = NEW."id"
      AND section."group_id" <> NEW."group_id"
  ) THEN
    RAISE EXCEPTION 'Assignment material section targets must belong to group %', NEW."group_id"
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "assignment_material_subsection_targets" AS target
    JOIN "material_subsections" AS subsection ON subsection."id" = target."material_subsection_id"
    WHERE target."assignment_id" = NEW."id"
      AND subsection."group_id" <> NEW."group_id"
  ) THEN
    RAISE EXCEPTION 'Assignment material subsection targets must belong to group %', NEW."group_id"
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "assignment_lesson_targets_require_same_group_trigger"
BEFORE INSERT OR UPDATE OF "assignment_id", "lesson_id" ON "assignment_lesson_targets"
FOR EACH ROW
EXECUTE FUNCTION "enforce_assignment_lesson_target_group_match"();

CREATE TRIGGER "assignment_material_section_targets_require_same_group_trigger"
BEFORE INSERT OR UPDATE OF "assignment_id", "material_section_id" ON "assignment_material_section_targets"
FOR EACH ROW
EXECUTE FUNCTION "enforce_assignment_material_section_target_group_match"();

CREATE TRIGGER "assignment_material_subsection_targets_require_same_group_trigger"
BEFORE INSERT OR UPDATE OF "assignment_id", "material_subsection_id" ON "assignment_material_subsection_targets"
FOR EACH ROW
EXECUTE FUNCTION "enforce_assignment_material_subsection_target_group_match"();

CREATE TRIGGER "assignments_require_same_group_targets_trigger"
BEFORE UPDATE OF "group_id" ON "assignments"
FOR EACH ROW
EXECUTE FUNCTION "enforce_assignment_targets_group_match"();
