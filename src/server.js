const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const multer = require("multer");
const { sendResponse } = require("./utils/response");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const studentsRoutes = require("./routes/students.routes");
const reportsRoutes = require("./routes/reports.routes");
const documentsRoutes = require("./routes/documents.routes");
const anecdotesRoutes = require("./routes/anecdotes.routes");
const questionsRoutes = require("./routes/questions.routes");
const apeRoutes = require("./routes/ape.routes");
const logsRoutes = require("./routes/logs.routes");
const searchRoutes = require("./routes/search.routes");
const summaryRoutes = require("./routes/summary.routes");
const templateRoutes = require("./routes/templates.routes");
const studentReportsRoutes = require("./routes/studentReports.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ name: "POS PAUD Melati Azzahra API", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api", studentReportsRoutes);
app.use("/api/reports", studentReportsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/anecdotes", anecdotesRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/ape", apeRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/rapor", templateRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return sendResponse(res, 400, `Field '${err.field}' tidak diharapkan. Untuk dokumen gunakan field 'file', untuk gambar gunakan field 'photo' atau 'image'`);
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendResponse(res, 400, "Ukuran file terlalu besar");
    }
    return sendResponse(res, 400, `Error upload: ${err.message}`);
  }

  if (err.message) {
    return sendResponse(res, err.status || 500, err.message);
  }

  return sendResponse(res, 500, "Terjadi kesalahan pada server");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
