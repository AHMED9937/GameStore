import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DISALLOWED = ['LoadingState', 'LoadingSurface', 'Spinner'];
const TARGET_DIRS = ['apps/web/src', 'libs/web'];
const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);

function collectFiles(dir: string, out: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.next')) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (!FILE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }
    if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.tsx')) {
      continue;
    }
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
      continue;
    }
    out.push(full);
  }
}

function resolveWorkspaceRoot(): string {
  let current = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (
      fs.existsSync(path.join(current, 'apps', 'web')) &&
      fs.existsSync(path.join(current, 'libs', 'web'))
    ) {
      return current;
    }
    current = path.resolve(current, '..');
  }
  return process.cwd();
}

describe('skeleton-only loading guard', () => {
  it('avoids non-skeleton loading components in app/features', () => {
    const root = resolveWorkspaceRoot();
    const files: string[] = [];
    for (const target of TARGET_DIRS) {
      const absolute = path.join(root, target);
      if (fs.existsSync(absolute)) {
        collectFiles(absolute, files);
      }
    }

    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const token of DISALLOWED) {
        if (content.includes(token)) {
          violations.push(`${path.relative(root, file)} contains ${token}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
