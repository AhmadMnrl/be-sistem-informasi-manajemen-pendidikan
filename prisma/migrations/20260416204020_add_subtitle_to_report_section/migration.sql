/*
  Warnings:

  - You are about to drop the column `subSection` on the `reportsection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `reportsection` DROP COLUMN `subSection`,
    ADD COLUMN `subtitle` VARCHAR(191) NULL;
