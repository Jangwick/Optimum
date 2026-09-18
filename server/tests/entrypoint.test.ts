import { spawnSync } from 'node:child_process';
import path from 'node:path';

describe('container startup (medium: local shell)', () => {
  it('reports a missing database without disclosing other environment variables', () => {
    const shell = process.platform === 'win32'
      ? path.join(process.env.ProgramFiles ?? 'C:/Program Files', 'Git/bin/bash.exe')
      : '/bin/sh';
    const result = spawnSync(shell, ['entrypoint.sh'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        JWT_SECRET: 'sensitive-sentinel-never-log',
      },
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('DATABASE_URL');
    expect(result.stdout + result.stderr).not.toContain('sensitive-sentinel-never-log');
  });
});
