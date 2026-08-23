/**
 * One-time migration: normalise stored file paths to use forward slashes.
 *
 * Existing paths may contain Windows backslashes (e.g. "uploads\claims\3\file.jpg")
 * which don't resolve on Linux. This script converts them to forward slashes
 * and strips any leading "./" so they're clean relative paths.
 */
import { prisma } from '../src/db/client.js';

async function migrate() {
  console.log('Migrating inspection photo paths...');
  const photos = await prisma.inspectionPhoto.findMany();
  for (const photo of photos) {
    const normalised = photo.path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (normalised !== photo.path) {
      await prisma.inspectionPhoto.update({ where: { id: photo.id }, data: { path: normalised } });
      console.log(`  Photo ${photo.id}: "${photo.path}" -> "${normalised}"`);
    }
  }

  console.log('Migrating document paths...');
  const docs = await prisma.document.findMany();
  for (const doc of docs) {
    const normalised = doc.path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (normalised !== doc.path) {
      await prisma.document.update({ where: { id: doc.id }, data: { path: normalised } });
      console.log(`  Document ${doc.id}: "${doc.path}" -> "${normalised}"`);
    }
  }

  console.log('Migrating report template paths...');
  const templates = await prisma.reportTemplate.findMany();
  for (const tpl of templates) {
    if (!tpl.path) continue;
    const normalised = tpl.path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (normalised !== tpl.path) {
      await prisma.reportTemplate.update({ where: { id: tpl.id }, data: { path: normalised } });
      console.log(`  Template ${tpl.id}: "${tpl.path}" -> "${normalised}"`);
    }
  }

  console.log('Migration complete.');
  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
