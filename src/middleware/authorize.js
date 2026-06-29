const { sendResponse } = require('../utils/response');

/**
 * Middleware otorisasi berbasis role.
 *
 * Perilaku:
 * - Jika allowedRoles kosong → semua role yang terautentikasi diizinkan.
 * - Jika allowedRoles diisi → hanya role yang terdaftar yang lolos.
 *   Tidak ada role yang mendapat bypass otomatis — ADMIN dan KEPALA_SEKOLAH
 *   harus secara eksplisit disertakan di allowedRoles jika ingin diizinkan.
 *
 * Contoh:
 *   authorize('ADMIN')                      → hanya ADMIN
 *   authorize('ADMIN', 'KEPALA_SEKOLAH')    → ADMIN dan KEPALA_SEKOLAH
 *   authorize()                             → semua role
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return sendResponse(res, 401, 'Unauthorized - User tidak ditemukan');
        }

        // Jika tidak ada role yang ditentukan, izinkan semua pengguna terautentikasi
        if (allowedRoles.length === 0) {
            return next();
        }

        // Cek apakah role pengguna ada di daftar yang diizinkan
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return sendResponse(res, 403, 'Forbidden - Anda tidak memiliki akses');
    };
}

module.exports = { authorize };