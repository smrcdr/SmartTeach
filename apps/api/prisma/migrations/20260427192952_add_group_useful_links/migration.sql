-- AlterTable
ALTER TABLE "group_settings" ADD COLUMN     "useful_links_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "group_useful_links" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "image_file_id" UUID,
    "sort_order" INTEGER NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "group_useful_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_useful_links_group_id_sort_order_idx" ON "group_useful_links"("group_id", "sort_order");

-- CreateIndex
CREATE INDEX "group_useful_links_image_file_id_idx" ON "group_useful_links"("image_file_id");

-- CreateIndex
CREATE INDEX "group_useful_links_created_by_user_id_idx" ON "group_useful_links"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "group_useful_links" ADD CONSTRAINT "group_useful_links_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_useful_links" ADD CONSTRAINT "group_useful_links_image_file_id_fkey" FOREIGN KEY ("image_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_useful_links" ADD CONSTRAINT "group_useful_links_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
