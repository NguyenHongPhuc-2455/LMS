/*
  Warnings:

  - You are about to drop the column `drm_key_id` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `drm_key_secret` on the `lessons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "drm_key_id",
DROP COLUMN "drm_key_secret",
ADD COLUMN     "hls_iv" VARCHAR(50),
ADD COLUMN     "hls_key" BYTEA;
