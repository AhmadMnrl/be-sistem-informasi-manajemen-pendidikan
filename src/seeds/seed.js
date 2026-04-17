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
    { name: "Kepala Sekolah", email: "kepsek@local.test", role: "KEPALA_SEKOLAH" },
    { name: "Guru A", email: "guru1@local.test", role: "GURU" },
    { name: "Guru B", email: "guru2@local.test", role: "GURU" },
    { name: "Guru C", email: "guru3@local.test", role: "GURU" },
    { name: "Guru D", email: "guru4@local.test", role: "GURU" },
    { name: "Staf Admin 1", email: "admin1@local.test", role: "ADMIN" },
    { name: "Staf Admin 2", email: "admin2@local.test", role: "ADMIN" },
    { name: "Kepsek Cadangan", email: "kepsek2@local.test", role: "KEPALA_SEKOLAH" },
    { name: "Guru E", email: "guru5@local.test", role: "GURU" },
  ];

  await prisma.user.createMany({
    data: users.map((u) => ({ ...u, passwordHash })),
  });

  console.log(`👤 User dibuat: ${users.length}`);

  return prisma.user.findMany({ orderBy: { id: "asc" } });
}

async function seedStudents() {
  const data = Array.from({ length: 10 }).map((_, idx) => {
    const n = idx + 1;
    return {
      name: `Siswa ${n}`,
      identifier: `334450${String(100 + n)}`,
      nisn: `00987654${String(10 + n)}`,
      className: n <= 5 ? "A" : "B",
      tahunAjaran: "2025/2026",
      parentName: `Orang Tua ${n}`,
      parentPhone: `081230000${String(n).padStart(2, "0")}`,
      address: `Jl. Pendidikan No. ${n}`,
      photoUrl: buildImagePath(`student-${n}.jpg`),
    };
  });

  data.forEach((s) => writeDummyIfNotExists(s.photoUrl, `dummy image ${s.name}`));
  await prisma.student.createMany({ data });
  console.log(`🎓 Siswa dibuat: ${data.length}`);

  return prisma.student.findMany({ orderBy: { id: "asc" } });
}

async function seedReports(users, students) {
  const teachers = users.filter((u) => u.role === "GURU");
  const items = students.slice(0, 10).map((s, idx) => ({
    title: `Laporan Harian ${s.name}`,
    description: `Perkembangan ${s.name} pada kegiatan belajar ke-${idx + 1}`,
    photoUrl: `/uploads/images/report-${idx + 1}.jpg`,
    date: dateOnlyToUTC(`2026-04-${String(idx + 1).padStart(2, "0")}`),
    studentId: s.id,
    teacherId: teachers[idx % teachers.length].id,
  }));

  items.forEach((r) => writeDummyIfNotExists(r.photoUrl, `dummy image ${r.title}`));
  await prisma.report.createMany({ data: items });
  console.log(`📄 Report dibuat: ${items.length}`);
}

async function seedDocuments(users) {
  const uploaders = users.filter((u) => ["ADMIN", "KEPALA_SEKOLAH"].includes(u.role));
  const categories = ["Laporan", "Administrasi", "Surat", "Dokumentasi", "Evaluasi"];

  const docs = Array.from({ length: 10 }).map((_, idx) => {
    const n = idx + 1;
    const filePath = buildDocumentPath(`document-${n}.pdf`);
    writeDummyIfNotExists(filePath, `dummy document ${n}`);
    return {
      title: `Dokumen Sekolah ${n}`,
      category: categories[idx % categories.length],
      filePath,
      documentDate: dateOnlyToUTC(`2026-03-${String(10 + n).padStart(2, "0")}`),
      uploadedById: uploaders[idx % uploaders.length].id,
    };
  });

  await prisma.document.createMany({ data: docs });
  console.log(`📎 Dokumen dibuat: ${docs.length}`);
}

async function seedAnecdotes(users) {
  const teachers = users.filter((u) => u.role === "GURU");
  const categories = ["Sosial Emosional", "Kemandirian", "Bahasa", "Karakter", "Kognitif"];

  const items = Array.from({ length: 10 }).map((_, idx) => {
    const n = idx + 1;
    const imageUrl = buildImagePath(`anecdote-${n}.jpg`);
    writeDummyIfNotExists(imageUrl, `dummy anecdote image ${n}`);

    return {
      content: `Catatan anekdot ke-${n}`,
      description: `Siswa menunjukkan perilaku positif pada sesi pembelajaran ke-${n}.`,
      category: categories[idx % categories.length],
      date: dateOnlyToUTC(`2026-04-${String(n).padStart(2, "0")}`),
      imageUrl,
      teacherId: teachers[idx % teachers.length].id,
    };
  });

  await prisma.anecdote.createMany({ data: items });
  console.log(`🗒️ Anekdot dibuat: ${items.length}`);
}

async function seedQuestions(users) {
  const teachers = users.filter((u) => u.role === "GURU");
  const sections = ["Section 1", "Section 2", "Section 3"];

  const items = Array.from({ length: 10 }).map((_, idx) => ({
    text: `Pertanyaan umum ke-${idx + 1}`,
    section: sections[idx % sections.length],
    imageUrl: idx % 3 === 0 ? buildImagePath(`question-${idx + 1}.jpg`) : null,
    teacherId: teachers[idx % teachers.length].id,
  }));

  items.filter((q) => q.imageUrl).forEach((q) => writeDummyIfNotExists(q.imageUrl, `dummy question image ${q.text}`));

  await prisma.question.createMany({ data: items });
  console.log(`❓ Question dibuat: ${items.length}`);
}

async function seedApe(users) {
  const admins = users.filter((u) => ["ADMIN", "KEPALA_SEKOLAH"].includes(u.role));
  const conditions = ["Baik", "Cukup", "Perlu Perbaikan"];

  const items = Array.from({ length: 10 }).map((_, idx) => ({
    name: `APE Item ${idx + 1}`,
    condition: conditions[idx % conditions.length],
    quantity: 5 + idx,
    location: `Ruang ${idx % 2 === 0 ? "A" : "B"}`,
    createdById: admins[idx % admins.length].id,
    updatedById: admins[(idx + 1) % admins.length].id,
  }));

  await prisma.ape.createMany({ data: items });
  console.log(`🧸 APE dibuat: ${items.length}`);
}

async function seedTemplateAndStudentReports(users, students) {
  const creator = users.find((u) => ["ADMIN", "KEPALA_SEKOLAH"].includes(u.role));
  const teachers = users.filter((u) => u.role === "GURU");

  const template = await prisma.reportTemplate.create({
    data: {
      title: "Template Rapor Semester Genap 2025/2026",
      year: 2026,
      isActive: true,
      createdById: creator.id,
    },
  });

  const sections = await Promise.all([
    prisma.reportSection.create({
      data: {
        templateId: template.id,
        sectionNumber: 1,
        order: 1,
        type: "TABLE",
        title: "Penilaian Predikat",
        headers: "Question,Predikat",
      },
    }),
    prisma.reportSection.create({
      data: {
        templateId: template.id,
        sectionNumber: 2,
        order: 2,
        type: "TEXT",
        title: "Catatan Naratif",
        headers: "Question,Jawaban",
      },
    }),
    prisma.reportSection.create({
      data: {
        templateId: template.id,
        sectionNumber: 3,
        order: 3,
        type: "MIXED",
        title: "Dokumentasi Foto",
        headers: "Question,Foto,Keterangan",
      },
    }),
  ]);

  const questionBlueprints = [
    { sectionId: sections[0].id, text: "Mengenal huruf vokal", type: "QUESTION" },
    { sectionId: sections[0].id, text: "Mengenal angka 1-20", type: "QUESTION" },
    { sectionId: sections[0].id, text: "Mengikuti instruksi guru", type: "QUESTION" },
    { sectionId: sections[0].id, text: "Kerja sama dengan teman", type: "QUESTION" },
    { sectionId: sections[0].id, text: "Kemandirian saat tugas", type: "QUESTION" },
    { sectionId: sections[0].id, text: "Kebiasaan hidup bersih", type: "QUESTION" },
    { sectionId: sections[1].id, text: "Catatan perkembangan bahasa", type: "FREE_TEXT" },
    { sectionId: sections[1].id, text: "Catatan perkembangan motorik", type: "FREE_TEXT" },
    { sectionId: sections[2].id, text: "Foto kegiatan kolase", type: "PHOTO" },
    { sectionId: sections[2].id, text: "Foto kegiatan olahraga", type: "PHOTO" },
  ];

  const reportQuestions = [];
  for (let i = 0; i < questionBlueprints.length; i += 1) {
    const q = await prisma.reportQuestion.create({
      data: {
        sectionId: questionBlueprints[i].sectionId,
        text: questionBlueprints[i].text,
        order: i + 1,
        type: questionBlueprints[i].type,
      },
    });
    reportQuestions.push(q);
  }

  const optionLabels = ["SANGAT BAIK", "BAIK", "CUKUP", "PERLU BIMBINGAN"];
  for (const q of reportQuestions.filter((it) => it.type === "QUESTION")) {
    await prisma.reportAnswerOption.createMany({
      data: optionLabels.map((label) => ({ questionId: q.id, label })),
    });
  }

  const studentReports = [];
  for (let i = 0; i < 10; i += 1) {
    const report = await prisma.studentReport.create({
      data: {
        studentId: students[i % students.length].id,
        templateId: template.id,
        year: 2026,
        tahunAjaran: "2025/2026",
        semester: i % 2 === 0 ? "GANJIL" : "GENAP",
        createdById: teachers[i % teachers.length].id,
      },
    });
    studentReports.push(report);
  }

  for (let i = 0; i < studentReports.length; i += 1) {
    const sr = studentReports[i];
    for (const q of reportQuestions) {
      const base = {
        studentReportId: sr.id,
        questionId: q.id,
        ket: `Keterangan laporan ${i + 1}`,
        predikat: q.type === "QUESTION" ? optionLabels[(i + q.id) % optionLabels.length] : null,
      };

      if (q.type === "QUESTION") {
        await prisma.studentReportAnswer.create({
          data: {
            ...base,
            selectedOption: optionLabels[(i + q.id) % optionLabels.length],
          },
        });
      } else if (q.type === "FREE_TEXT") {
        await prisma.studentReportAnswer.create({
          data: {
            ...base,
            answerText: `Narasi perkembangan siswa untuk ${q.text.toLowerCase()}`,
          },
        });
      } else {
        const photoUrl = buildImagePath(`student-report-${sr.id}-q${q.id}.jpg`);
        writeDummyIfNotExists(photoUrl, `dummy student report photo ${sr.id}-${q.id}`);
        await prisma.studentReportAnswer.create({
          data: {
            ...base,
            photoUrl,
          },
        });
      }
    }
  }

  console.log("📘 Template, sections, questions, options, student reports, dan answers berhasil dibuat.");
}

async function seedActivityLogs(users) {
  const actions = ["LOGIN", "CREATE_STUDENT", "UPDATE_STUDENT", "CREATE_DOCUMENT", "CREATE_ANECDOTE", "CREATE_QUESTION", "CREATE_APE", "CREATE_REPORT", "CREATE_TEMPLATE", "SUBMIT_STUDENT_REPORT"];

  const logs = Array.from({ length: 10 }).map((_, idx) => ({
    action: actions[idx],
    entity: idx % 2 === 0 ? "Student" : "Document",
    entityId: idx + 1,
    metadata: { note: `Dummy activity ${idx + 1}`, source: "seed" },
    userId: users[idx % users.length].id,
  }));

  await prisma.activityLog.createMany({ data: logs });
  console.log(`🧾 Activity log dibuat: ${logs.length}`);
}

async function main() {
  await ensureUploads();
  await resetData();

  const users = await seedUsers();
  const students = await seedStudents();

  await seedReports(users, students);
  await seedDocuments(users);
  await seedAnecdotes(users);
  await seedQuestions(users);
  await seedApe(users);
  await seedTemplateAndStudentReports(users, students);
  await seedActivityLogs(users);
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
