ALTER TABLE "groups"
  ADD COLUMN "avatar_file_id" UUID,
  ADD COLUMN "catalog_image_file_id" UUID;

CREATE INDEX "groups_avatar_file_id_idx" ON "groups"("avatar_file_id");
CREATE INDEX "groups_catalog_image_file_id_idx" ON "groups"("catalog_image_file_id");

ALTER TABLE "groups"
  ADD CONSTRAINT "groups_avatar_file_id_fkey"
  FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "groups"
  ADD CONSTRAINT "groups_catalog_image_file_id_fkey"
  FOREIGN KEY ("catalog_image_file_id") REFERENCES "files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
