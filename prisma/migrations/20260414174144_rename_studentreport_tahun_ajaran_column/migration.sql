/*
  Warnings:

  - You are about to drop the column `tahunAjaran` on the `studentreport` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `studentreport` DROP COLUMN `tahunAjaran`,
    ADD COLUMN `tahun_ajaran` VARCHAR(191) NULL;
