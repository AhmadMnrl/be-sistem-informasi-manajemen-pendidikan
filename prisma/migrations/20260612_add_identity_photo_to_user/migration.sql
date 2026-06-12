-- Add identityPhotoUrl column to user table (handles both `user` and `User` table names)
SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'user'
        AND column_name = 'identityPhotoUrl'
    ) THEN 'SELECT 1'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'user'
    ) THEN 'ALTER TABLE `user` ADD COLUMN `identityPhotoUrl` VARCHAR(191) NULL'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'User'
        AND column_name = 'identityPhotoUrl'
    ) THEN 'SELECT 1'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'User'
    ) THEN 'ALTER TABLE `User` ADD COLUMN `identityPhotoUrl` VARCHAR(191) NULL'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
