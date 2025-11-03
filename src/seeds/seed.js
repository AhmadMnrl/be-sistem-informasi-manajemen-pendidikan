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

async function seedUsers() {
	const users = [
		{ name: 'Administrator', email: 'admin@local.test', role: 'ADMIN', password: 'admin123' },
		{ name: 'Kepala Sekolah', email: 'kepsek@local.test', role: 'KEPALA_SEKOLAH', password: 'kepsek123' },
		{ name: 'Guru A', email: 'guru1@local.test', role: 'GURU', password: 'guru12345' },
		{ name: 'Guru B', email: 'guru2@local.test', role: 'GURU', password: 'guru12345' },
	];
	for (const u of users) {
		const exist = await prisma.user.findUnique({ where: { email: u.email } });
		if (!exist) {
			const passwordHash = await bcrypt.hash(u.password, 10);
			await prisma.user.create({ data: { name: u.name, email: u.email, role: u.role, passwordHash } });
			console.log('User dibuat:', u.email, '(role:', u.role + ')');
		}
	}
}

async function seedStudents() {
	const data = [
		{ name: 'Aulia', identifier: 'S001', className: 'A', parentName: 'Budi', parentPhone: '081234567890', address: 'Jl. Mawar No. 1' },
		{ name: 'Bagas', identifier: 'S002', className: 'A', parentName: 'Sinta', parentPhone: '081234567891', address: 'Jl. Melati No. 2' },
		{ name: 'Citra', identifier: 'S003', className: 'B', parentName: 'Rudi', parentPhone: '081234567892', address: 'Jl. Kenanga No. 3' },
	];
	for (const s of data) {
		const exist = await prisma.student.findFirst({ where: { identifier: s.identifier } });
		if (!exist) {
			await prisma.student.create({ data: s });
			console.log('Siswa dibuat:', s.name);
		}
	}
}

async function seedReports() {
	const guru = await prisma.user.findFirst({ where: { role: 'GURU' } });
	const students = await prisma.student.findMany({ take: 2, orderBy: { id: 'asc' } });
	if (!guru || students.length === 0) return;
	const items = [
		{ title: 'Perkembangan Motorik Halus', description: 'Menggunting dengan pola sederhana', studentId: students[0].id },
		{ title: 'Perkembangan Sosial', description: 'Berbagi mainan dengan teman', studentId: students[1].id },
	];
	for (const r of items) {
		await prisma.report.create({ data: { ...r, teacherId: guru.id } });
		console.log('Rapor dibuat:', r.title);
	}
}

async function seedDocuments() {
	const uploader = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'KEPALA_SEKOLAH'] } } });
	if (!uploader) return;
	const docs = [
		{ title: 'Laporan Mutu 2025', category: 'Akreditasi', filePath: '/uploads/documents/laporan-mutu-sample.pdf' },
		{ title: 'Eviden Kegiatan Belajar', category: 'Eviden', filePath: '/uploads/documents/eviden-kegiatan-sample.pdf' },
	];
	// buat file dummy kosong
	for (const d of docs) {
		const abs = path.join(process.cwd(), d.filePath.replace(/^\//, ''));
		if (!fs.existsSync(abs)) fs.writeFileSync(abs, 'dummy');
		await prisma.document.create({ data: { title: d.title, category: d.category, filePath: d.filePath, uploadedById: uploader.id } });
		console.log('Dokumen dibuat:', d.title);
	}
}

async function seedAnecdotes() {
	const guru = await prisma.user.findFirst({ where: { role: 'GURU' } });
	const student = await prisma.student.findFirst();
	if (!guru || !student) return;
	const items = [
		{ content: 'Hari ini sangat antusias saat bernyanyi.', studentId: student.id },
		{ content: 'Mau merapikan mainan setelah selesai.', studentId: student.id },
	];
	for (const a of items) {
		await prisma.anecdote.create({ data: { ...a, teacherId: guru.id } });
		console.log('Anekdot dibuat:', a.content.slice(0, 30) + '...');
	}
}

async function seedQuestions() {
	const guru = await prisma.user.findFirst({ where: { role: 'GURU' } });
	if (!guru) return;
	const items = [
		{ text: 'Sebutkan warna bendera Indonesia!' },
		{ text: 'Berapakah jumlah jari tangan?' },
	];
	for (const q of items) {
		await prisma.question.create({ data: { text: q.text, teacherId: guru.id } });
		console.log('Soal dibuat:', q.text);
	}
}

async function seedApe() {
	const user = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'KEPALA_SEKOLAH'] } } });
	if (!user) return;
	const items = [
		{ name: 'Balok Kayu', condition: 'Baik', quantity: 20, location: 'Ruang A' },
		{ name: 'Puzzle Huruf', condition: 'Cukup', quantity: 10, location: 'Ruang B' },
	];
	for (const i of items) {
		await prisma.ape.create({ data: { ...i, updatedById: user.id } });
		console.log('APE dibuat:', i.name);
	}
}

async function main() {
	await ensureUploads();
	await seedUsers();
	await seedStudents();
	await seedReports();
	await seedDocuments();
	await seedAnecdotes();
	await seedQuestions();
	await seedApe();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
