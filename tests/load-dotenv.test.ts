import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDotEnv } from '../src/lib/load-dotenv.ts';

describe('loadDotEnv', () => {
  let tempDir: string;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'truss-ask-env-'));
    saved.DOTENV_TEST_KEY = process.env.DOTENV_TEST_KEY;
    delete process.env.DOTENV_TEST_KEY;
  });

  afterEach(() => {
    if (saved.DOTENV_TEST_KEY === undefined) {
      delete process.env.DOTENV_TEST_KEY;
    } else {
      process.env.DOTENV_TEST_KEY = saved.DOTENV_TEST_KEY;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads variables from .env without overwriting existing env', () => {
    writeFileSync(join(tempDir, '.env'), 'DOTENV_TEST_KEY=from_file\n');
    process.env.DOTENV_TEST_KEY = 'already_set';
    loadDotEnv(tempDir);
    assert.equal(process.env.DOTENV_TEST_KEY, 'already_set');
  });

  it('sets unset variables from .env', () => {
    writeFileSync(join(tempDir, '.env'), 'DOTENV_TEST_KEY=from_file\n');
    loadDotEnv(tempDir);
    assert.equal(process.env.DOTENV_TEST_KEY, 'from_file');
  });

  it('ignores comments and blank lines', () => {
    writeFileSync(join(tempDir, '.env'), '# comment\n\nDOTENV_TEST_KEY=value\n');
    loadDotEnv(tempDir);
    assert.equal(process.env.DOTENV_TEST_KEY, 'value');
  });
});
