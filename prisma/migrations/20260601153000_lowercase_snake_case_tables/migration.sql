-- Rename existing CamelCase tables to lowercase snake_case for consistent schema names.
-- Each rename is conditional so the migration can run on databases that already
-- have the lowercase table names.
SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'ActivityLog'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'activity_log'
    )
    THEN 'RENAME TABLE `ActivityLog` TO `activity_log`'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'ReportTemplate'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'report_template'
    )
    THEN 'RENAME TABLE `ReportTemplate` TO `report_template`'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'ReportSection'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'report_section'
    )
    THEN 'RENAME TABLE `ReportSection` TO `report_section`'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'ReportQuestion'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'report_question'
    )
    THEN 'RENAME TABLE `ReportQuestion` TO `report_question`'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'ReportAnswerOption'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'report_answer_option'
    )
    THEN 'RENAME TABLE `ReportAnswerOption` TO `report_answer_option`'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'StudentReport'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'student_report'
    )
    THEN 'RENAME TABLE `StudentReport` TO `student_report`'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'StudentReportAnswer'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'student_report_answer'
    )
    THEN 'RENAME TABLE `StudentReportAnswer` TO `student_report_answer`'
    ELSE 'SELECT 1'
  END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
