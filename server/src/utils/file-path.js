import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

/**
 * Resolve a stored file path to an absolute filesystem path.
 *
 * Stored paths may be:
 * - Absolute (e.g. C:\...\uploads\claims\3\file.jpg or /home/app/uploads/...)
 * - Relative with Windows backslashes (e.g. uploads\claims\3\file.jpg)
 * - Relative with forward slashes (e.g. uploads/claims/3/file.jpg)
 *
 * This function normalises separators and resolves relative paths against
 * the server's working directory (where the process runs), so files work
 * regardless of the OS or CWD.
 */
export function resolveFilePath(storedPath) {
  if (!storedPath) return null;

  // Normalise backslashes to forward slashes for cross-platform compatibility
  const normalised = storedPath.replace(/\\/g, '/');

  // If already absolute, use as-is (but still normalised)
  if (path.isAbsolute(normalised)) {
    return normalised;
  }

  // Relative paths are stored relative to the server root (e.g. "uploads/claims/3/file.jpg")
  // Resolve against CWD, which is the server directory when running
  return path.resolve(normalised);
}

/**
 * Check whether a file exists at the stored path.
 */
export function fileExists(storedPath) {
  const resolved = resolveFilePath(storedPath);
  if (!resolved) return false;
  return fs.existsSync(resolved);
}

/**
 * Get a relative path (with forward slashes) for storing in the database.
 * If the path is within the upload directory, it will be made relative.
 */
export function toRelativePath(absolutePath) {
  if (!absolutePath) return absolutePath;
  const uploadDir = config.uploadDir || './uploads';
  const resolvedUpload = path.resolve(uploadDir);
  const resolved = path.resolve(absolutePath);

  if (resolved.startsWith(resolvedUpload)) {
    // Make relative to upload dir, using forward slashes
    const rel = path.relative(resolvedUpload, resolved);
    return rel.replace(/\\/g, '/');
  }

  // Already relative or outside upload dir — just normalise separators
  return absolutePath.replace(/\\/g, '/');
}
