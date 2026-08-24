import { resolveFilePath, toRelativePath } from '../src/utils/file-path.js';

describe('file-path', () => {
  it('resolves a relative path under the upload root', () => {
    const resolved = resolveFilePath('uploads/claims/3/file.jpg');
    expect(resolved).toBeTruthy();
    expect(resolved!.endsWith('uploads\\claims\\3\\file.jpg')).toBe(true);
  });

  it('rejects relative traversal outside the upload root', () => {
    expect(resolveFilePath('..\\..\\package.json')).toBeNull();
    expect(resolveFilePath('..\\..\\..\\etc\\passwd')).toBeNull();
  });

  it('rejects absolute paths outside the upload root', () => {
    if (process.platform === 'win32') {
      expect(resolveFilePath('C:\\Windows\\notepad.exe')).toBeNull();
    } else {
      expect(resolveFilePath('/etc/passwd')).toBeNull();
    }
  });

  it('returns null for empty or null paths', () => {
    expect(resolveFilePath(null)).toBeNull();
    expect(resolveFilePath('')).toBeNull();
  });

  it('toRelativePath rejects paths outside the upload root', () => {
    if (process.platform === 'win32') {
      expect(toRelativePath('C:\\Windows\\notepad.exe')).toBeNull();
    } else {
      expect(toRelativePath('/etc/passwd')).toBeNull();
    }
    expect(toRelativePath('..\\..\\package.json')).toBeNull();
  });
});
