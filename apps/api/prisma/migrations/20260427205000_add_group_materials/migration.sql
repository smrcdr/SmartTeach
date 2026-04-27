-- CreateTable
CREATE TABLE "material_sections" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "material_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_subsections" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "material_subsections_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "material_subsection_id" UUID;

-- AlterTable
ALTER TABLE "assignments"
ADD COLUMN "material_section_id" UUID,
ADD COLUMN "material_subsection_id" UUID;

-- CreateIndex
CREATE INDEX "material_sections_group_id_sort_order_idx" ON "material_sections"("group_id", "sort_order");

-- CreateIndex
CREATE INDEX "material_sections_created_by_user_id_idx" ON "material_sections"("created_by_user_id");

-- CreateIndex
CREATE INDEX "material_subsections_group_id_sort_order_idx" ON "material_subsections"("group_id", "sort_order");

-- CreateIndex
CREATE INDEX "material_subsections_section_id_sort_order_idx" ON "material_subsections"("section_id", "sort_order");

-- CreateIndex
CREATE INDEX "material_subsections_created_by_user_id_idx" ON "material_subsections"("created_by_user_id");

-- CreateIndex
CREATE INDEX "lessons_material_subsection_id_idx" ON "lessons"("material_subsection_id");

-- CreateIndex
CREATE INDEX "lessons_group_id_material_subsection_id_sort_order_idx" ON "lessons"("group_id", "material_subsection_id", "sort_order");

-- CreateIndex
CREATE INDEX "assignments_material_section_id_idx" ON "assignments"("material_section_id");

-- CreateIndex
CREATE INDEX "assignments_material_subsection_id_idx" ON "assignments"("material_subsection_id");

-- AddForeignKey
ALTER TABLE "material_sections" ADD CONSTRAINT "material_sections_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_sections" ADD CONSTRAINT "material_sections_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_subsections" ADD CONSTRAINT "material_subsections_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_subsections" ADD CONSTRAINT "material_subsections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "material_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_subsections" ADD CONSTRAINT "material_subsections_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_material_subsection_id_fkey" FOREIGN KEY ("material_subsection_id") REFERENCES "material_subsections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_material_section_id_fkey" FOREIGN KEY ("material_section_id") REFERENCES "material_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_material_subsection_id_fkey" FOREIGN KEY ("material_subsection_id") REFERENCES "material_subsections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "assignments"
ADD CONSTRAINT "assignments_single_material_target_check"
CHECK (
  (
    ("lesson_id" IS NOT NULL)::int
    + ("material_section_id" IS NOT NULL)::int
    + ("material_subsection_id" IS NOT NULL)::int
  ) <= 1
);

CREATE OR REPLACE FUNCTION "enforce_material_subsection_group_match"()
RETURNS TRIGGER AS $$
DECLARE
  section_group_id UUID;
BEGIN
  SELECT "group_id"
  INTO section_group_id
  FROM "material_sections"
  WHERE "id" = NEW."section_id";

  IF section_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF section_group_id <> NEW."group_id" THEN
    RAISE EXCEPTION 'Material subsection section % must belong to group %', NEW."section_id", NEW."group_id"
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "material_subsections_require_same_group_section_trigger"
BEFORE INSERT OR UPDATE OF "group_id", "section_id" ON "material_subsections"
FOR EACH ROW
EXECUTE FUNCTION "enforce_material_subsection_group_match"();

CREATE OR REPLACE FUNCTION "enforce_lesson_material_subsection_group_match"()
RETURNS TRIGGER AS $$
DECLARE
  subsection_group_id UUID;
BEGIN
  IF NEW."material_subsection_id" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "group_id"
  INTO subsection_group_id
  FROM "material_subsections"
  WHERE "id" = NEW."material_subsection_id";

  IF subsection_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF subsection_group_id <> NEW."group_id" THEN
    RAISE EXCEPTION 'Lesson material subsection % must belong to group %', NEW."material_subsection_id", NEW."group_id"
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "lessons_require_same_group_material_subsection_trigger"
BEFORE INSERT OR UPDATE OF "group_id", "material_subsection_id" ON "lessons"
FOR EACH ROW
EXECUTE FUNCTION "enforce_lesson_material_subsection_group_match"();

CREATE OR REPLACE FUNCTION "enforce_assignment_material_target_group_match"()
RETURNS TRIGGER AS $$
DECLARE
  section_group_id UUID;
  subsection_group_id UUID;
BEGIN
  IF NEW."material_section_id" IS NOT NULL THEN
    SELECT "group_id"
    INTO section_group_id
    FROM "material_sections"
    WHERE "id" = NEW."material_section_id";

    IF section_group_id IS NOT NULL AND section_group_id <> NEW."group_id" THEN
      RAISE EXCEPTION 'Assignment material section % must belong to group %', NEW."material_section_id", NEW."group_id"
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW."material_subsection_id" IS NOT NULL THEN
    SELECT "group_id"
    INTO subsection_group_id
    FROM "material_subsections"
    WHERE "id" = NEW."material_subsection_id";

    IF subsection_group_id IS NOT NULL AND subsection_group_id <> NEW."group_id" THEN
      RAISE EXCEPTION 'Assignment material subsection % must belong to group %', NEW."material_subsection_id", NEW."group_id"
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "assignments_require_same_group_material_targets_trigger"
BEFORE INSERT OR UPDATE OF "group_id", "material_section_id", "material_subsection_id" ON "assignments"
FOR EACH ROW
EXECUTE FUNCTION "enforce_assignment_material_target_group_match"();

CREATE OR REPLACE FUNCTION "trg_assert_material_section_constraints"()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM "assert_lessons_enabled"(NEW."group_id");

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "material_sections_require_enabled_group_settings_trigger"
AFTER INSERT OR UPDATE OF "group_id" ON "material_sections"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_material_section_constraints"();

CREATE CONSTRAINT TRIGGER "material_subsections_require_enabled_group_settings_trigger"
AFTER INSERT OR UPDATE OF "group_id" ON "material_subsections"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_material_section_constraints"();
