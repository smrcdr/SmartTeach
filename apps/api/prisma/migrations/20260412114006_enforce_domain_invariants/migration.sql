CREATE OR REPLACE FUNCTION "assert_group_has_settings"(target_group_id UUID)
RETURNS VOID AS $$
BEGIN
  IF target_group_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "groups"
    WHERE "id" = target_group_id
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "group_settings"
    WHERE "group_id" = target_group_id
  ) THEN
    RAISE EXCEPTION 'Group % must have a group_settings row', target_group_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "trg_assert_group_has_settings"()
RETURNS TRIGGER AS $$
DECLARE
  target_group_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_group_id := OLD."group_id";
  ELSIF TG_TABLE_NAME = 'groups' THEN
    target_group_id := NEW."id";
  ELSE
    target_group_id := NEW."group_id";
  END IF;

  PERFORM "assert_group_has_settings"(target_group_id);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "groups_require_group_settings_trigger"
AFTER INSERT OR UPDATE ON "groups"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_group_has_settings"();

CREATE CONSTRAINT TRIGGER "group_settings_require_existing_group_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "group_settings"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_group_has_settings"();

CREATE OR REPLACE FUNCTION "assert_group_owner_membership"(target_group_id UUID)
RETURNS VOID AS $$
DECLARE
  group_owner_id UUID;
BEGIN
  IF target_group_id IS NULL THEN
    RETURN;
  END IF;

  SELECT "owner_id"
  INTO group_owner_id
  FROM "groups"
  WHERE "id" = target_group_id;

  IF group_owner_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "group_members"
    WHERE "group_id" = target_group_id
      AND "user_id" = group_owner_id
      AND "role" = 'OWNER'
  ) THEN
    RAISE EXCEPTION 'Group % owner % must be a group member with OWNER role', target_group_id, group_owner_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "trg_assert_group_owner_membership"()
RETURNS TRIGGER AS $$
DECLARE
  target_group_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_group_id := OLD."group_id";
  ELSIF TG_TABLE_NAME = 'groups' THEN
    target_group_id := NEW."id";
  ELSE
    target_group_id := NEW."group_id";
  END IF;

  PERFORM "assert_group_owner_membership"(target_group_id);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "groups_require_owner_membership_trigger"
AFTER INSERT OR UPDATE ON "groups"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_group_owner_membership"();

CREATE CONSTRAINT TRIGGER "group_members_require_owner_consistency_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "group_members"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_group_owner_membership"();

CREATE OR REPLACE FUNCTION "enforce_join_request_group_access_mode"()
RETURNS TRIGGER AS $$
DECLARE
  target_access_mode "GroupAccessMode";
BEGIN
  SELECT "access_mode"
  INTO target_access_mode
  FROM "groups"
  WHERE "id" = NEW."group_id";

  IF target_access_mode IS NULL THEN
    RETURN NEW;
  END IF;

  IF target_access_mode <> 'BY_REQUEST' THEN
    RAISE EXCEPTION 'Join requests are allowed only for BY_REQUEST groups. Group % is %', NEW."group_id", target_access_mode
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "group_join_requests_require_by_request_mode_trigger"
BEFORE INSERT OR UPDATE OF "group_id" ON "group_join_requests"
FOR EACH ROW
EXECUTE FUNCTION "enforce_join_request_group_access_mode"();

CREATE OR REPLACE FUNCTION "enforce_assignment_lesson_group_match"()
RETURNS TRIGGER AS $$
DECLARE
  lesson_group_id UUID;
BEGIN
  IF NEW."lesson_id" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "group_id"
  INTO lesson_group_id
  FROM "lessons"
  WHERE "id" = NEW."lesson_id";

  IF lesson_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF lesson_group_id <> NEW."group_id" THEN
    RAISE EXCEPTION 'Assignment lesson % must belong to group %', NEW."lesson_id", NEW."group_id"
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "assignments_require_same_group_lesson_trigger"
BEFORE INSERT OR UPDATE OF "group_id", "lesson_id" ON "assignments"
FOR EACH ROW
EXECUTE FUNCTION "enforce_assignment_lesson_group_match"();

CREATE OR REPLACE FUNCTION "assert_direct_chat_has_two_members"(target_chat_id UUID)
RETURNS VOID AS $$
DECLARE
  chat_kind "ChatType";
  member_count INTEGER;
BEGIN
  IF target_chat_id IS NULL THEN
    RETURN;
  END IF;

  SELECT "chat_type"
  INTO chat_kind
  FROM "chats"
  WHERE "id" = target_chat_id;

  IF chat_kind IS NULL OR chat_kind <> 'DIRECT' THEN
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO member_count
  FROM "chat_members"
  WHERE "chat_id" = target_chat_id;

  IF member_count <> 2 THEN
    RAISE EXCEPTION 'Direct chat % must have exactly two members, found %', target_chat_id, member_count
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "trg_assert_direct_chat_has_two_members"()
RETURNS TRIGGER AS $$
DECLARE
  target_chat_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_chat_id := OLD."chat_id";
  ELSIF TG_TABLE_NAME = 'chats' THEN
    target_chat_id := NEW."id";
  ELSE
    target_chat_id := NEW."chat_id";
  END IF;

  PERFORM "assert_direct_chat_has_two_members"(target_chat_id);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "direct_chats_require_two_members_trigger"
AFTER INSERT OR UPDATE ON "chats"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_direct_chat_has_two_members"();

CREATE CONSTRAINT TRIGGER "chat_members_require_direct_chat_consistency_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "chat_members"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_direct_chat_has_two_members"();

CREATE OR REPLACE FUNCTION "assert_message_has_content"(target_message_id UUID)
RETURNS VOID AS $$
DECLARE
  normalized_text TEXT;
BEGIN
  IF target_message_id IS NULL THEN
    RETURN;
  END IF;

  SELECT NULLIF(BTRIM("text"), '')
  INTO normalized_text
  FROM "messages"
  WHERE "id" = target_message_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF normalized_text IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "message_files"
      WHERE "message_id" = target_message_id
    ) THEN
    RAISE EXCEPTION 'Message % must contain text or at least one attachment', target_message_id
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "trg_assert_message_has_content"()
RETURNS TRIGGER AS $$
DECLARE
  target_message_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_message_id := OLD."message_id";
  ELSIF TG_TABLE_NAME = 'messages' THEN
    target_message_id := NEW."id";
  ELSE
    target_message_id := NEW."message_id";
  END IF;

  PERFORM "assert_message_has_content"(target_message_id);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "messages_require_content_trigger"
AFTER INSERT OR UPDATE ON "messages"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_message_has_content"();

CREATE CONSTRAINT TRIGGER "message_files_require_message_content_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "message_files"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "trg_assert_message_has_content"();
