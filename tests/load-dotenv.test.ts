import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadAllEnv, loadDotEnv } from '../src/lib/load-dotenv.ts';

describe('loadDotEnv', () => {
  let tempDir: string;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'truss-mcp-env-'));
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
});

describe('loadAllEnv', () => {
  let tempDir: string;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'truss-mcp-all-env-'));
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

  it('project .env overrides user-default fill semantics', () => {
    writeFileSync(join(tempDir, '.env'), 'DOTENV_TEST_KEY=from_project\n');
    loadAllEnv(tempDir);
    assert.equal(process.env.DOTENV_TEST_KEY, 'from_project');
  });
});
