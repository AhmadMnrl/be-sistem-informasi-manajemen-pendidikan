-- AlterTable
ALTER TABLE `anecdote` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- RedefineIndex
CREATE INDEX `Anecdote_teacherId_idx` ON `Anecdote`(`teacherId`);