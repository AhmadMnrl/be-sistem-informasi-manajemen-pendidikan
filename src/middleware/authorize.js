const { sendResponse } = require('../utils/response');

function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return sendResponse(res, 401, 'Unauthorized - User tidak ditemukan');
        }

        // ADMIN dan KEPALA_SEKOLAH bisa akses semua
        if (req.user.role === 'ADMIN' || req.user.role === 'KEPALA_SEKOLAH') {
            return next();
        }

        // Role lain harus sesuai allowedRoles
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return sendResponse(res, 403, 'Forbidden - Anda tidak memiliki akses');
    };
}

module.exports = { authorize };