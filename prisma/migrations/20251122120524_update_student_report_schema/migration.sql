-- AlterTable
ALTER TABLE `reportquestion` ADD COLUMN `type` ENUM('QUESTION', 'FREE_TEXT', 'PHOTO') NOT NULL DEFAULT 'QUESTION';

-- AlterTable
ALTER TABLE `reportsection` ADD COLUMN `order` INTEGER NULL,
    MODIFY `type` ENUM('TABLE', 'TEXT', 'MIXED') NOT NULL;

-- AlterTable
ALTER TABLE `reporttemplate` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
