/*
  Warnings:

  - You are about to drop the column `value` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "value";

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "content",
DROP COLUMN "published",
ALTER COLUMN "name" DROP DEFAULT;
