import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateFilterExpression } from '../src/lib/validate-filter-expression.ts';

describe('validateFilterExpression', () => {
  it('rejects empty expressions', () => {
    assert.deepEqual(validateFilterExpression(''), {
      valid: false,
      error: 'filterExpression is empty',
    });
    assert.deepEqual(validateFilterExpression('   '), {
      valid: false,
      error: 'filterExpression is empty',
    });
  });

  it('accepts valid FilterQL', () => {
    assert.deepEqual(validateFilterExpression('category = "Malware"'), { valid: true });
  });

  it('rejects invalid FilterQL', () => {
    const result = validateFilterExpression('category === Malware');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });
});
