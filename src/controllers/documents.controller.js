const path = require("path");
const fs = require("fs");
const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { paginate } = require("../utils/pagination");
const { normalizeFilePath, buildDocumentPath } = require("../utils/filePath");
const { uploadToSupabase } = require("../utils/supabaseStorage");

function resolveUploadedDocumentPath(req) {
  if (req.file?.filename) return buildDocumentPath(req.file.filename);

  const fileField = req.files?.file?.[0];
  if (fileField?.filename) return buildDocumentPath(fileField.filename);

  const filePathField = req.files?.filePath?.[0];
  if (filePathField?.filename) return buildDocumentPath(filePathField.filename);

  return null;
}

// Helper: parse YYYY-MM-DD ke Date dengan waktu 00:00:00
function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

// Helper: format Date ke YYYY-MM-DD
function formatDateOnly(date) {
  if (!date) return null;
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Helper: format document untuk response
function formatDocument(doc) {
  return { ...doc, documentDate: formatDateOnly(doc.documentDate) };
}

async function listDocuments(req, res) {
  const { page = 1, pageSize = 5 } = req.query;
  const q = req.query.q || "";

  // filter: type/category + documentDate
  const type = req.query.type ?? req.query.category;
  const documentDateFrom = req.query.documentDateFrom;
  const documentDateTo = req.query.documentDateTo;
  const documentDate = req.query.documentDate;

  try {
    const where = {
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(type && String(type).trim()
        ? {
            category: String(type).trim(),
          }
        : {}),
      ...(documentDate
        ? {
            documentDate: {
              gte: parseDateOnly(documentDate),
              lt: new Date(parseDateOnly(documentDate).getTime() + 24 * 60 * 60 * 1000),
            },
          }
        : {}),
      ...(!documentDate && (documentDateFrom || documentDateTo)
        ? {
            documentDate: {
              ...(documentDateFrom ? { gte: parseDateOnly(documentDateFrom) } : {}),
              ...(documentDateTo
                ? {
                    lt: new Date(parseDateOnly(documentDateTo).getTime() + 24 * 60 * 60 * 1000),
                  }
                : {}),
            },
          }
        : {}),
    };

    const whereFinal = Object.keys(where).length ? where : undefined;

    const result = await paginate({
      countFn: () => prisma.document.count({ where: whereFinal }),
      queryFn: (offset, ps) =>
        prisma.document.findMany({
          where: whereFinal,
          orderBy: { id: "desc" },
          skip: offset,
          take: ps,
        }),
      page,
      pageSize,
    });

    return sendResponse(res, 200, "Data dokumen berhasil diambil", {
      ...result,
      data: result.data?.map((d) => formatDocument(d)),
    });
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil data dokumen");
  }
}

async function createDocument(req, res) {
  const { title, category, documentDate, filePath: filePathFromBody } = req.body || {};
  if (!title) return sendResponse(res, 400, "Judul dokumen wajib");

  // Jika ada file upload (multipart), maka unggah ke Supabase Storage
  // lalu simpan public URL ke DB.
  let filePath = null;
  const uploadedById = req.user.id;

  // Prefer file yang benar-benar diupload multipart
  if (req.file?.buffer) {
    // multer memory storage (kalau suatu saat dikonfigurasi)
    const { originalname, mimetype } = req.file;
    const bucket = process.env.SUPABASE_DOCS_BUCKET || "documents";
    const ext = path.extname(originalname);
    const ts = Date.now();
    const fileName = `dokumen_${ts}${ext}`;

    const uploadRes = await uploadToSupabase({
      bucket,
      fileName,
      fileBuffer: req.file.buffer,
      contentType: mimetype || "application/octet-stream",
    });

    filePath = uploadRes.publicUrl;
  } else {
    const uploadedPath = resolveUploadedDocumentPath(req);
    filePath = uploadedPath || normalizeFilePath(filePathFromBody);

    // NOTE: Saat ini upload.js masih diskStorage, jadi req.file.buffer tidak tersedia.
    // Jika file memang tersimpan di disk, kita bisa baca file-nya lalu upload ke Supabase.
    if (!filePath && req.file?.path) filePath = normalizeFilePath(req.file.path);
    if (uploadedPath && req.file?.path) {
      // uploadedPath biasanya berupa path relatif; ambil path asli dari multer
      try {
        const abs = req.file.path;
        const fileBuffer = fs.readFileSync(abs);
        const bucket = process.env.SUPABASE_DOCS_BUCKET || "documents";
        const originalname = req.file.originalname || "document";
        const ext = path.extname(originalname);
        const ts = Date.now();
        const fileName = `dokumen_${ts}${ext}`;

        const uploadRes = await uploadToSupabase({
          bucket,
          fileName,
          fileBuffer,
          contentType: req.file.mimetype || "application/octet-stream",
        });

        filePath = uploadRes.publicUrl;
      } catch (e) {
        // fallback ke filePath dari uploadedPath
        filePath = uploadedPath;
      }
    }
  }

  if (!filePath) return sendResponse(res, 400, "File wajib diisi (upload field 'file'/'filePath' atau kirim filePath string)");

  try {
    const created = await prisma.document.create({
      data: {
        title,
        category: category || null,
        documentDate: documentDate ? new Date(documentDate) : new Date(),
        filePath,
        uploadedById,
      },
    });
    await logActivity({ userId: req.user.id, action: "CREATE_DOCUMENT", entity: "Document", entityId: created.id });
    return sendResponse(res, 201, "Dokumen berhasil dibuat", created);
  } catch (e) {
    return sendResponse(res, 500, "Gagal membuat dokumen");
  }
}

async function getDocument(req, res) {
  const id = Number(req.params.id);
  try {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return sendResponse(res, 404, "Dokumen tidak ditemukan");
    return sendResponse(res, 200, "Data dokumen berhasil diambil", document);
  } catch (e) {
    return sendResponse(res, 404, "Dokumen tidak ditemukan");
  }
}

async function updateDocument(req, res) {
  const id = Number(req.params.id);
  const { title, category, documentDate, filePath: filePathFromBody } = req.body || {};
  const data = {};

  if (title !== undefined) data.title = title;
  if (category !== undefined) data.category = category || null;
  if (documentDate !== undefined) data.documentDate = new Date(documentDate);
  const uploadedPath = resolveUploadedDocumentPath(req);
  if (uploadedPath) data.filePath = uploadedPath;
  else if (filePathFromBody !== undefined) data.filePath = normalizeFilePath(filePathFromBody);

  try {
    const updated = await prisma.document.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: "UPDATE_DOCUMENT", entity: "Document", entityId: updated.id });
    return sendResponse(res, 200, "Dokumen berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 404, "Dokumen tidak ditemukan");
  }
}

async function deleteDocument(req, res) {
  const id = Number(req.params.id);
  try {
    await prisma.document.delete({ where: { id } });
    await logActivity({ userId: req.user.id, action: "DELETE_DOCUMENT", entity: "Document", entityId: id });
    return sendResponse(res, 200, "Dokumen berhasil dihapus");
  } catch (e) {
    return sendResponse(res, 404, "Dokumen tidak ditemukan");
  }
}

const UPLOADS_ROOT = process.env.UPLOADS_ROOT || path.join(process.cwd(), "uploads");

async function downloadDocument(req, res) {
  const id = Number(req.params.id);
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return sendResponse(res, 404, "Dokumen tidak ditemukan");

  const absPath = path.join(UPLOADS_ROOT, doc.filePath.replace(/^\/uploads\//, ""));
  // console.log("Download absPath:", absPath);

  if (!fs.existsSync(absPath)) return sendResponse(res, 404, "File tidak ditemukan di server");

  return res.download(absPath, path.basename(absPath));
}

async function viewDocumentFile(req, res) {
  const id = Number(req.params.id);
  const doc = await prisma.document.findUnique({ where: { id } });

  if (!doc) return sendResponse(res, 404, "Dokumen tidak ditemukan");

  const UPLOADS_ROOT = process.env.UPLOADS_ROOT || path.join(process.cwd(), "uploads");
  const absPath = path.join(UPLOADS_ROOT, doc.filePath.replace(/^\/uploads\//, ""));

  if (!fs.existsSync(absPath)) return sendResponse(res, 404, "File tidak ditemukan di server");

  const ext = path.extname(absPath).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
  };

  const mimeType = mimeTypes[ext] || "application/octet-stream";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(absPath)}"`);

  return res.sendFile(absPath);
}

module.exports = { listDocuments, createDocument, getDocument, updateDocument, deleteDocument, downloadDocument, viewDocumentFile };
