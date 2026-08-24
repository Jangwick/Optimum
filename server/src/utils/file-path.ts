import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

/**
 * Check whether a resolved path is contained within a root directory.
 * Uses path.relative to avoid case and separator pitfalls with startsWith.
 */
function isWithinRoot(root: string, resolved: string): boolean {
  const rel = path.relative(root, resolved);
  return rel ? !rel.startsWith('..') && !path.isAbsolute(rel) : true;
}

/**
 * Resolve a stored file path to an absolute filesystem path, constrained
 * to the supplied root directory to prevent path traversal.
 *
 * Stored paths may be:
 * - Absolute (e.g. C:\...\uploads\claims\3\file.jpg or /home/app/uploads/...)
 * - Relative with Windows backslashes (e.g. uploads\claims\3\file.jpg)
 * - Relative with forward slashes (e.g. uploads/claims/3/file.jpg)
 *
 * Relative paths are resolved against the parent of the root directory, so
 * legacy paths that begin with the root's directory name (e.g. "uploads/...")
 * continue to work while ".." or absolute paths outside the root are rejected.
 */
export function resolveFilePath(storedPath: string | null | undefined, rootDir: string = config.uploadDir): string | null {
  if (!storedPath) return null;

  const root = path.resolve(rootDir);
  const baseDir = path.resolve(root, '..');

  // Normalise backslashes to forward slashes for cross-platform compatibility
  const normalised = storedPath.replace(/\\/g, '/');

  // Resolve the path. Absolute paths are kept absolute; relative paths are
  // resolved against the parent of the root directory, matching the legacy
  // convention of storing "uploads/<subpath>" relative to the server root.
  const resolved = path.isAbsolute(normalised)
    ? path.resolve(normalised)
    : path.resolve(baseDir, normalised);

  if (!isWithinRoot(root, resolved)) {
    return null;
  }

  return resolved;
}

/**
 * Check whether a file exists at the stored path.
 */
export function fileExists(storedPath: string | null | undefined, rootDir: string = config.uploadDir): boolean {
  const resolved = resolveFilePath(storedPath, rootDir);
  if (!resolved) return false;
  return fs.existsSync(resolved);
}

/**
 * Get a relative path (with forward slashes) for storing in the database.
 * If the path is within the root directory, it will be made relative to that root.
 * Returns null for paths outside the root to prevent leaking unsafe paths.
 */
export function toRelativePath(absolutePath: string | null | undefined, rootDir: string = config.uploadDir): string | null {
  if (!absolutePath) return absolutePath ?? null;
  const root = path.resolve(rootDir);
  const resolved = path.resolve(absolutePath);

  if (!isWithinRoot(root, resolved)) {
    return null;
  }

  const rel = path.relative(root, resolved);
  return rel.replace(/\\/g, '/');
}
