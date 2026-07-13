
function normalizeFilePath(filePath) {
  if (!filePath) return null;

  if (filePath.startsWith("/uploads/")) return filePath;

  if (filePath.includes("uploads/")) {
    const idx = filePath.indexOf("uploads/");
    return "/" + filePath.substring(idx);
  }

  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

const BASE_URL = process.env.BASE_URL || "https://api.pospaudmelatiazzahra.com";


function buildImagePath(filename) {
  if (!filename) return null;
  return `/uploads/images/${filename}`;
}

function buildDocumentPath(filename) {
  if (!filename) return null;
  return `/uploads/documents/${filename}`;
}

module.exports = { BASE_URL, normalizeFilePath, buildImagePath, buildDocumentPath };
