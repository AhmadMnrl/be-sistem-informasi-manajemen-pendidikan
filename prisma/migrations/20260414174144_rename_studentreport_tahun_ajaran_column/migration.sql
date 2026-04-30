/*
  Warnings:

  - You are about to drop the column `tahunAjaran` on the `StudentReport` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `StudentReport` DROP COLUMN `tahunAjaran`,
  ADD COLUMN `tahun_ajaran` VARCHAR(191) NULL;
