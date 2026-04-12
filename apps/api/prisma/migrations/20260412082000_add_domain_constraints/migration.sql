CREATE UNIQUE INDEX "group_members_one_owner_per_group_idx"
ON "group_members" ("group_id")
WHERE "role" = 'OWNER';

CREATE UNIQUE INDEX "group_join_requests_one_pending_idx"
ON "group_join_requests" ("group_id", "user_id")
WHERE "status" = 'PENDING';

CREATE UNIQUE INDEX "submissions_one_draft_idx"
ON "submissions" ("assignment_id", "author_id")
WHERE "status" = 'DRAFT';

ALTER TABLE "chats"
ADD CONSTRAINT "chats_group_or_direct_consistency_check"
CHECK (
  (
    "chat_type" = 'GROUP'
    AND "group_id" IS NOT NULL
    AND "direct_chat_key" IS NULL
  )
  OR (
    "chat_type" = 'DIRECT'
    AND "group_id" IS NULL
    AND "direct_chat_key" IS NOT NULL
  )
);
