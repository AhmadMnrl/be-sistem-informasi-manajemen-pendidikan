const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsRoot = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);

function makeStorage(subdir) {
	const dest = path.join(uploadsRoot, subdir);
	if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
	return multer.diskStorage({
		destination: (req, file, cb) => cb(null, dest),
		filename: (req, file, cb) => {
			const ext = path.extname(file.originalname);
			const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
			const ts = Date.now();
			cb(null, `${base}-${ts}${ext}`);
		},
	});
}

const imageFilter = (req, file, cb) => {
	if (/^image\//.test(file.mimetype)) return cb(null, true);
	cb(new Error('File harus berupa gambar')); 
};

const uploadImage = multer({ storage: makeStorage('images'), fileFilter: imageFilter });
const uploadDocument = multer({ storage: makeStorage('documents') });

module.exports = { uploadImage, uploadDocument };
