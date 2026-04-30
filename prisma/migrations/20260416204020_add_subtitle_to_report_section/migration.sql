/*
  Warnings:

  - You are about to drop the column `subSection` on the `ReportSection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ReportSection` DROP COLUMN `subSection`,
  ADD COLUMN `subtitle` VARCHAR(191) NULL;
