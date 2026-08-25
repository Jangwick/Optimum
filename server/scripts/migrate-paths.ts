import { prisma } from '../src/db/client.js';

interface PhotoLike { id: number; path: string; }
interface DocLike { id: number; path: string; }
interface TemplateLike { id: number; path: string | null; }

function normalisePath(stored: string): string {
  return stored.replace(/\\/g, '/').replace(/^\.\//, '');
}

async function migrate() {
  console.log('Migrating inspection photo paths...');
  const photos = await prisma.inspectionPhoto.findMany() as PhotoLike[];
  for (const photo of photos) {
    const normalised = normalisePath(photo.path);
    if (normalised !== photo.path) {
      await prisma.inspectionPhoto.update({ where: { id: photo.id }, data: { path: normalised } });
      console.log(`  Photo ${photo.id}: "${photo.path}" -> "${normalised}"`);
    }
  }

  console.log('Migrating document paths...');
  const docs = await prisma.document.findMany() as DocLike[];
  for (const doc of docs) {
    const normalised = normalisePath(doc.path);
    if (normalised !== doc.path) {
      await prisma.document.update({ where: { id: doc.id }, data: { path: normalised } });
      console.log(`  Document ${doc.id}: "${doc.path}" -> "${normalised}"`);
    }
  }

  console.log('Migrating report template paths...');
  const templates = await prisma.reportTemplate.findMany() as TemplateLike[];
  for (const tpl of templates) {
    if (!tpl.path) continue;
    const normalised = normalisePath(tpl.path);
    if (normalised !== tpl.path) {
      await prisma.reportTemplate.update({ where: { id: tpl.id }, data: { path: normalised } });
      console.log(`  Template ${tpl.id}: "${tpl.path}" -> "${normalised}"`);
    }
  }

  console.log('Migration complete.');
  await prisma.$disconnect();
}

migrate().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
