/*
  Warnings:

  - Made the column `identifier` on table `student` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `student` ADD COLUMN `nisn` VARCHAR(191) NULL,
    ADD COLUMN `tahunAjaran` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `identifier` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Student_identifier_idx` ON `Student`(`identifier`);
