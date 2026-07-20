const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const { sendResponse } = require("./utils/response");
const { swaggerSpec } = require("./docs/swagger.loader");
require("dotenv").config({ quiet: true });

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const studentsRoutes = require("./routes/students.routes");
const reportsRoutes = require("./routes/reports.routes");
const documentsRoutes = require("./routes/documents.routes");
const anecdotesRoutes = require("./routes/anecdotes.routes");
const questionsRoutes = require("./routes/questions.routes");
const apeRoutes = require("./routes/ape.routes");
const logsRoutes = require("./routes/logs.routes");
const summaryRoutes = require("./routes/summary.routes");
const templateRoutes = require("./routes/templates.routes");
const studentReportsRoutes = require("./routes/studentReports.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.get(/^\/api\/reports\/images\/(.*)$/, (req, res) => {
  const rawPath = req.params[0] || "";
  let normalized = String(rawPath).replace(/^\/+/, "");

  if (normalized.startsWith("uploads/images/")) {
    normalized = normalized.slice("uploads/images/".length);
  }

  if (normalized.startsWith("images/")) {
    normalized = normalized.slice("images/".length);
  }

  const absPath = path.join(process.cwd(), "uploads", "images", normalized);
  if (!fs.existsSync(absPath)) {
    return sendResponse(res, 404, "Image tidak ditemukan");
  }

  return res.sendFile(absPath);
});

app.get("/api", (req, res) => {
  res.json({
    name: "POS PAUD Melati Azzahra API",
    version: "1.0.0",
    status: "active",
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.redirect("/api");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "SIM Pendidikan API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/reports", studentReportsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/anecdotes", anecdotesRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/ape", apeRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/rapor", templateRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return sendResponse(res, 400, `Field '${err.field}' tidak diharapkan. Untuk dokumen gunakan field 'file' atau 'filePath', untuk gambar gunakan field 'photo', 'image', atau 'imageUrl'`);
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

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}
