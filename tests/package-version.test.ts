import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readPackageVersion } from '../src/lib/package-version.ts';

describe('readPackageVersion', () => {
  it('returns semver from package.json', () => {
    const version = readPackageVersion(import.meta.url);
    assert.match(version, /^\d+\.\d+\.\d+$/);
  });
});
