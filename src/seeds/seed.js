require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { prisma } = require('../prisma');

async function ensureUploads() {
	const dirs = [
		path.join(process.cwd(), 'uploads/images'),
		path.join(process.cwd(), 'uploads/documents'),
	];
	dirs.forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
}

async function resetData() {
	await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
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
	console.log('✅ Semua data lama berhasil dihapus');
}

async function seedUsers() {
	const users = [
		{ name: 'Administrator', email: 'admin@local.test', role: 'ADMIN', password: 'admin123' },
		{ name: 'Kepala Sekolah', email: 'kepsek@local.test', role: 'KEPALA_SEKOLAH', password: 'kepsek123' },
		{ name: 'Guru A', email: 'guru1@local.test', role: 'GURU', password: 'guru12345' },
		{ name: 'Guru B', email: 'guru2@local.test', role: 'GURU', password: 'guru12345' },
	];
	for (const u of users) {
		const passwordHash = await bcrypt.hash(u.password, 10);
		await prisma.user.create({ data: { name: u.name, email: u.email, role: u.role, passwordHash } });
		console.log('👤 User dibuat:', u.email, `(role: ${u.role})`);
	}
}

async function seedStudents() {
	const data = [
		{ name: 'Aulia', identifier: '334451001', nisn: '0012345678', className: 'A', tahunAjaran: '2024/2025', parentName: 'Budi', parentPhone: '08123456789', address: 'Jl. Merdeka No. 1' },
		{ name: 'Bima', identifier: '334421002', nisn: '0012345679', className: 'A', tahunAjaran: '2024/2025', parentName: 'Ahmad', parentPhone: '08123456790', address: 'Jl. Sudirman No. 2' },
	];
	for (const s of data) {
		await prisma.student.create({ data: s });
		console.log('🎓 Siswa dibuat:', s.name);
	}
}

async function seedReports() {
	const guru = await prisma.user.findFirst({ where: { role: 'GURU' } });
	const students = await prisma.student.findMany({ take: 2 });
	const items = [
		{ title: 'Perkembangan Motorik Halus', description: 'Menggunting dengan pola sederhana', studentId: students[0].id },
		{ title: 'Perkembangan Sosial', description: 'Berbagi mainan dengan teman', studentId: students[1].id },
	];
	for (const r of items) {
		await prisma.report.create({ data: { ...r, teacherId: guru.id } });
		console.log('📄 Rapor dibuat:', r.title);
	}
}

async function seedDocuments() {
	const uploader = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'KEPALA_SEKOLAH'] } } });
	const docs = [
		{ title: 'Laporan Mutu 2022', category: 'Akreditasi', filePath: '/uploads/documents/laporan-mutu-2022.pdf', documentDate: '2022-06-01' },
		{ title: 'Eviden Kegiatan Belajar 2023', category: 'Eviden', filePath: '/uploads/documents/eviden-kegiatan-2023.pdf', documentDate: '2023-03-15' },
	];
	for (const d of docs) {
		const abs = path.join(process.cwd(), d.filePath.replace(/^\//, ''));
		if (!fs.existsSync(abs)) fs.writeFileSync(abs, 'dummy');
		const docDate = d.documentDate ? new Date(d.documentDate + 'T00:00:00.000Z') : null;
		await prisma.document.create({ data: { title: d.title, category: d.category || null, filePath: d.filePath, uploadedById: uploader.id, documentDate: docDate } });
		console.log('📎 Dokumen dibuat:', d.title);
	}
}

async function seedAnecdotes() {
	const guru = await prisma.user.findFirst({ where: { role: 'GURU' } });
	const items = [
		{ content: 'Hari ini sangat antusias saat bernyanyi.' },
		{ content: 'Mau merapikan mainan setelah selesai.' },
	];
	for (const a of items) {
		await prisma.anecdote.create({ data: { ...a, teacherId: guru.id } });
		console.log('🗒️ Anekdot dibuat:', a.content.slice(0, 30) + '...');
	}
}

async function seedQuestions() {
	const guru = await prisma.user.findFirst({ where: { role: 'GURU' } });
	const items = [
		{ text: 'Sebutkan warna bendera Indonesia!' },
		{ text: 'Berapakah jumlah jari tangan?' },
	];
	for (const q of items) {
		await prisma.question.create({ data: { text: q.text, teacherId: guru.id } });
		console.log('❓ Soal dibuat:', q.text);
	}
}

async function seedApe() {
	const user = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'KEPALA_SEKOLAH'] } } });
	const items = [
		{ name: 'Balok Kayu', condition: 'Baik', quantity: 20, location: 'Ruang A' },
		{ name: 'Puzzle Huruf', condition: 'Cukup', quantity: 10, location: 'Ruang B' },
	];
	for (const i of items) {
		await prisma.ape.create({ data: { ...i, updatedById: user.id } });
		console.log('🧸 APE dibuat:', i.name);
	}
}

async function seedReportTemplateAndStudentReport() {
	const adminOrKepsek = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'KEPALA_SEKOLAH'] } } });
	const guru = await prisma.user.findFirst({ where: { role: 'GURU' } });
	const student = await prisma.student.findFirst();

	const template = await prisma.reportTemplate.create({
		data: {
			title: 'Template Rapor 2022',
			year: 2022,
			createdById: adminOrKepsek.id
		}
	});

	const section1 = await prisma.reportSection.create({
		data: {
			templateId: template.id,
			sectionNumber: 1,
			type: 'TABLE',
			title: 'Predikat Kemampuan',
			order: 1
		}
	});

	const q1 = await prisma.reportQuestion.create({
		data: {
			sectionId: section1.id,
			text: 'SISWA MAMPU MENJELASKAN TETEK BENGEK',
			order: 1,
			type: 'QUESTION'
		}
	});

	const q2 = await prisma.reportQuestion.create({
		data: {
			sectionId: section1.id,
			text: 'SISWA MAMPU berlari 100 meter dalam 1 menit',
			order: 2,
			type: 'QUESTION'
		}
	});

	for (const label of ['SANGAT MAMPU', 'MAMPU', 'CUKUP MAMPU', 'TIDAK MAMPU']) {
		await prisma.reportAnswerOption.create({ data: { questionId: q1.id, label } });
		await prisma.reportAnswerOption.create({ data: { questionId: q2.id, label } });
	}

	const section2 = await prisma.reportSection.create({
		data: {
			templateId: template.id,
			sectionNumber: 2,
			type: 'TEXT',
			title: 'Deskripsi Perkembangan Motorik Anak',
			order: 2
		}
	});

	const q3 = await prisma.reportQuestion.create({
	data: {
		sectionId: section2.id,
		text: 'Deskripsi Perkembangan Motorik Anak :',
		order: 1,
		type: 'FREE_TEXT'
	}
	});

	const sr = await prisma.studentReport.create({
	data: {
		studentId: student.id,
		templateId: template.id,
		year: 2022,
		createdById: guru.id
	}
	});

	await prisma.studentReportAnswer.create({
	data: {
		studentReportId: sr.id,
		questionId: q1.id,
		selectedOption: 'MAMPU',
		ket: 'Sudah konsisten'
	}
	});

	await prisma.studentReportAnswer.create({
	data: {
		studentReportId: sr.id,
		questionId: q2.id,
		selectedOption: 'CUKUP MAMPU',
		ket: 'Masih perlu latihan'
	}
	});

	await prisma.studentReportAnswer.create({
	data: {
		studentReportId: sr.id,
		questionId: q3.id,
		answerText: 'Sudah mampu berjalan dan melompat dengan baik',
		ket: 'Perlu penguatan koordinasi'
	}
	});

	console.log('📘 Template rapor & 1 student report dummy berhasil dibuat.');
	}

	async function main() {
		await ensureUploads();
		await resetData();
		await seedUsers();
		await seedStudents();
		await seedReports();
		await seedDocuments();
		await seedAnecdotes();
		await seedQuestions();
		await seedApe();
		await seedReportTemplateAndStudentReport();
	}

	main()
	.then(() => {
		console.log('\n✅ Seeding selesai!');
		process.exit(0);
	})
	.catch((e) => {
		console.error('❌ Seeding gagal:', e);
		process.exit(1);
	});