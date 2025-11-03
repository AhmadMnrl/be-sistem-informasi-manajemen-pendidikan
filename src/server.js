const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const studentsRoutes = require('./routes/students.routes');
const reportsRoutes = require('./routes/reports.routes');
const documentsRoutes = require('./routes/documents.routes');
const anecdotesRoutes = require('./routes/anecdotes.routes');
const questionsRoutes = require('./routes/questions.routes');
const apeRoutes = require('./routes/ape.routes');
const logsRoutes = require('./routes/logs.routes');
const searchRoutes = require('./routes/search.routes');
const summaryRoutes = require('./routes/summary.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
	res.json({ name: 'POS PAUD Melati Azzahra API', version: '1.0.0' });
});

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/anecdotes', anecdotesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/ape', apeRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/summary', summaryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`API running on port ${PORT}`);
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error('Unhandled Error:', err);
	return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});


