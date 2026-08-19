import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

const uploadDir = config.uploadDir || './uploads';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const claimId = req.params.claimId;
    const dest = claimId ? path.join(uploadDir, 'claims', String(claimId)) : uploadDir;
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize || 20 * 1024 * 1024 },
});

const templateFileFilter = (req, file, cb) => {
  if (file.originalname.toLowerCase().endsWith('.docx')) return cb(null, true);
  cb(new Error('Only .docx templates are allowed'), false);
};

export const templateUpload = multer({
  storage,
  fileFilter: templateFileFilter,
  limits: { fileSize: config.maxFileSize || 20 * 1024 * 1024 },
});
