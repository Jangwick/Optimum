import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import fs from 'fs';
import path from 'path';

const templateDir = './uploads/templates';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function listTemplates() {
  return prisma.reportTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTemplate(id) {
  const item = await prisma.reportTemplate.findUnique({ where: { id } });
  if (!item) throw new AppError('Template not found', 404);
  return item;
}

export async function createTemplate(data, file, _userId) {
  ensureDir(templateDir);

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(templateDir, fileName);
  fs.copyFileSync(file.path, filePath);

  return prisma.reportTemplate.create({
    data: {
      name: data.name || file.originalname,
      type: 'DOCX',
      fileName: file.originalname,
      path: filePath,
      description: data.description,
      isDefault: data.isDefault === 'true' || data.isDefault === true,
    },
  });
}
