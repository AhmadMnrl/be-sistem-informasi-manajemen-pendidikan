/**
 * Normalize file path untuk consistency
 * - Input: anything (absolute, relative, with/without leading slash)
 * - Output: /uploads/... (selalu dimulai dengan / untuk frontend)
 */
function normalizeFilePath(filePath) {
  if (!filePath) return null;

  // Jika sudah format /uploads/..., return as is
  if (filePath.startsWith("/uploads/")) return filePath;

  // Jika ada path uploads tapi tanpa leading slash
  if (filePath.includes("uploads/")) {
    const idx = filePath.indexOf("uploads/");
    return "/" + filePath.substring(idx);
  }

  // Jika hanya filename tanpa path, return null (error case)
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

/**
 * Build complete file URL dari filename saja
 */
function buildImagePath(filename) {
  if (!filename) return null;
  return `/uploads/images/${filename}`;
}

function buildDocumentPath(filename) {
  if (!filename) return null;
  return `/uploads/documents/${filename}`;
}

module.exports = { normalizeFilePath, buildImagePath, buildDocumentPath };
