/*
  Warnings:

  - A unique constraint covering the columns `[nisn]` on the table `student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Student_nisn_key` ON `student`(`nisn`);
