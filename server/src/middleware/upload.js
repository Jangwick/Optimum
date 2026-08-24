import multer from 'multer';
import path from 'path';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.js';

// Use memory storage so file data is stored in the database as a BLOB.
// This ensures files persist across deploys on ephemeral filesystems (e.g. Railway).
const storage = multer.memoryStorage();

const ALLOWED_FILES = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.txt': ['text/plain'],
};

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedMimes = ALLOWED_FILES[ext];

  if (!allowedMimes) {
    return cb(new Error('File type not allowed'), false);
  }

  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('File type does not match extension'), false);
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize || 20 * 1024 * 1024 },
});

const SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]],
};

function matchesSignature(buffer, mimetype) {
  const signatures = SIGNATURES[mimetype];
  if (!signatures) {
    // No signature for this type (text/plain). Reject obvious binary data
    // by checking for null bytes in the first 8 KB.
    const slice = buffer.slice(0, 8192);
    return !slice.includes(0x00);
  }

  if (mimetype === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = [0x52, 0x49, 0x46, 0x46].every((byte, i) => buffer[i] === byte);
    const webp = [0x57, 0x45, 0x42, 0x50].every((byte, i) => buffer[8 + i] === byte);
    return riff && webp;
  }

  for (const signature of signatures) {
    if (buffer.length < signature.length) continue;
    if (signature.every((byte, i) => buffer[i] === byte)) return true;
  }

  return false;
}

export function validateUpload(req, res, next) {
  if (!req.file) return next();
  if (!matchesSignature(req.file.buffer, req.file.mimetype)) {
    return next(new AppError('File content does not match the declared type', 400));
  }
  next();
}
