require("dotenv").config();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { prisma } = require("../prisma");
const { buildImagePath, buildDocumentPath } = require("../utils/filePath");

async function ensureUploads() {
  const dirs = [path.join(process.cwd(), "uploads/images"), path.join(process.cwd(), "uploads/documents")];
  dirs.forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function writeDummyIfNotExists(relativePath, content = "dummy") {
  const abs = path.join(process.cwd(), relativePath.replace(/^\//, ""));
  if (!fs.existsSync(abs)) fs.writeFileSync(abs, content);
}

function dateOnlyToUTC(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

async function ensureLowercaseTables() {
  const renames = [
    ["ActivityLog", "activity_log"],
    ["ReportTemplate", "report_template"],
    ["ReportSection", "report_section"],
    ["ReportQuestion", "report_question"],
    ["ReportAnswerOption", "report_answer_option"],
    ["StudentReport", "student_report"],
    ["StudentReportAnswer", "student_report_answer"],
    ["User", "user"],
    ["Student", "student"],
    ["Report", "report"],
    ["Document", "document"],
    ["Anecdote", "anecdote"],
    ["Question", "question"],
    ["Ape", "ape"],
  ];

  for (const [sourceTable, targetTable] of renames) {
    const [row] = await prisma.$queryRawUnsafe(
      `SELECT
         EXISTS(
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = DATABASE()
             AND table_name = '${sourceTable}'
         ) AS source_exists,
         EXISTS(
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = DATABASE()
             AND table_name = '${targetTable}'
         ) AS target_exists`
    );

    if (row?.source_exists && !row?.target_exists) {
      await prisma.$executeRawUnsafe(`RENAME TABLE \`${sourceTable}\` TO \`${targetTable}\``);
    }
  }
}

async function resetData() {
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
  await prisma.activityLog.deleteMany();
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
  await prisma.user.deleteMany();
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
  console.log("✅ Semua data lama berhasil dihapus");
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const users = [
    { name: "Administrator", email: "admin@local.test", role: "ADMIN" },
  ];

  await prisma.user.createMany({
    data: users.map((u) => ({ ...u, passwordHash })),
  });

  console.log(`👤 User dibuat: ${users.length}`);

  return prisma.user.findMany({ orderBy: { id: "asc" } });
}

async function main() {
  await ensureUploads();
  await ensureLowercaseTables();
  await resetData();
  const users = await seedUsers();
}

main()
  .then(() => {
    console.log("\n✅ Seeding selesai!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  });
