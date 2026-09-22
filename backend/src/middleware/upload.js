import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/response.js';
import { id } from '../utils/ids.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${id('f')}${ext || '.bin'}`);
  },
});

const allowed = /jpeg|jpg|png|gif|webp|svg|heic|avif/i;

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isImage = allowed.test(file.mimetype) || allowed.test(path.extname(file.originalname));
    if (!isImage) return cb(new AppError('Only image files are allowed', { status: 400, code: 'INVALID_FILE' }));
    return cb(null, true);
  },
});

export const publicUploadsPath = '/uploads';

export default upload;