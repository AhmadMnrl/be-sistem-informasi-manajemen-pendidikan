-- Rename existing lowercase tables to lowercase snake_case for consistent schema names
RENAME TABLE `activitylog` TO `activity_log`,
  `reporttemplate` TO `report_template`,
  `reportsection` TO `report_section`,
  `reportquestion` TO `report_question`,
  `reportansweroption` TO `report_answer_option`,
  `studentreport` TO `student_report`,
  `studentreportanswer` TO `student_report_answer`;
