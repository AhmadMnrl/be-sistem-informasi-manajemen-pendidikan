const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Setup test database
 */
const setupTestDB = async () => {
  try {
    // Just check connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.error('Failed to connect to test database:', err.message);
    throw err;
  }
};

/**
 * Cleanup: Delete all test data
 */
const cleanupTestDB = async () => {
  try {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

    // Delete in reverse order of dependencies
    await prisma.studentReportAnswer.deleteMany();
    await prisma.studentReport.deleteMany();
    await prisma.reportAnswerOption.deleteMany();
    await prisma.reportQuestion.deleteMany();
    await prisma.reportSection.deleteMany();
    await prisma.reportTemplate.deleteMany();
    await prisma.report.deleteMany();
    await prisma.anecdote.deleteMany();
    await prisma.document.deleteMany();
    await prisma.question.deleteMany();
    await prisma.ape.deleteMany();
    await prisma.student.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  } catch (err) {
    console.error('Failed to cleanup database:', err.message);
  }
};

/**
 * Close database connection
 */
const closeTestDB = async () => {
  await prisma.$disconnect();
};

module.exports = {
  prisma,
  setupTestDB,
  cleanupTestDB,
  closeTestDB,
};
