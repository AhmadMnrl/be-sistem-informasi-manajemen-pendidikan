const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { studentReportSubmitSchema } = require("../validators/schemas");
const { listStudentReports, getStudentReportDetail, downloadStudentReportsXlsx, submitStudentReport, updateStudentReport, deleteStudentReport } = require("../controllers/studentReports.controller");

const { buildImagePath } = require("../utils/filePath");

const router = express.Router();

function parseMultipartKey(key) {
  const parts = [];
  const matcher = /([^[\]]+)|\[(.*?)\]/g;
  let match;

  while ((match = matcher.exec(key)) !== null) {
    const segment = match[1] ?? match[2];
    if (segment === "") {
      parts.push("");
    } else if (segment !== undefined) {
      parts.push(segment);
    }
  }

  return parts;
}

function setNestedValue(target, pathParts, value) {
  let current = target;

  for (let index = 0; index < pathParts.length; index += 1) {
    const key = pathParts[index];
    const isLast = index === pathParts.length - 1;
    const nextKey = pathParts[index + 1];
    const nextIsArray = nextKey === "" || /^\d+$/.test(nextKey || "");

    if (isLast) {
      if (key === "") {
        if (!Array.isArray(current)) return;
        current.push(value);
        return;
      }

      if (/^\d+$/.test(key)) {
        if (!Array.isArray(current)) return;
        current[Number(key)] = value;
        return;
      }

      if (current[key] === undefined) {
        current[key] = value;
      } else if (Array.isArray(current[key])) {
        current[key].push(value);
      } else {
        current[key] = [current[key], value];
      }
      return;
    }

    if (key === "") {
      if (!Array.isArray(current)) return;
      let lastItem = current[current.length - 1];
      if (!lastItem || typeof lastItem !== "object") {
        lastItem = nextIsArray ? [] : {};
        current.push(lastItem);
      }
      current = lastItem;
      continue;
    }

    if (/^\d+$/.test(key)) {
      if (!Array.isArray(current)) return;
      const numericKey = Number(key);
      if (!current[numericKey] || typeof current[numericKey] !== "object") {
        current[numericKey] = nextIsArray ? [] : {};
      }
      current = current[numericKey];
      continue;
    }

    if (!current[key] || typeof current[key] !== "object") {
      current[key] = nextIsArray ? [] : {};
    }

    current = current[key];
  }
}

function normalizeMultipartBody(req, res, next) {
  if (!req.body || typeof req.body !== "object") return next();

  const normalized = {};
  for (const [key, value] of Object.entries(req.body)) {
    const parts = parseMultipartKey(key);
    if (parts.length === 0) {
      normalized[key] = value;
      continue;
    }
    setNestedValue(normalized, parts, value);
  }

  if (Array.isArray(req.files)) {
    for (const file of req.files) {
      const parts = parseMultipartKey(file.fieldname);
      if (parts.length === 0) continue;
      setNestedValue(normalized, parts, buildImagePath(file.filename));
    }
  }

  req.body = normalized;
  next();
}

// Detail report siswa by id
router.get("/student-reports", authMiddleware, listStudentReports);
router.get("/student-reports/:id", authMiddleware, getStudentReportDetail);

// Submit jawaban siswa (menerima format answers[] atau data/Questions)
router.post("/student-reports", authMiddleware, uploadImage.any(), normalizeMultipartBody, validate({ body: studentReportSubmitSchema }), submitStudentReport);

// Edit jawaban siswa yang sudah ada
router.put("/student-reports/:id", authMiddleware, uploadImage.any(), normalizeMultipartBody, validate({ body: studentReportSubmitSchema }), updateStudentReport);

// Hapus laporan siswa
router.delete("/student-reports/:id", authMiddleware, deleteStudentReport);

router.get("/student-reports/download", authMiddleware, downloadStudentReportsXlsx);

module.exports = router;

