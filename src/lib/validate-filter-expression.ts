import {
  parseExpressionToAst,
  validateExpressionSyntax,
} from '@truss-security/truss-sdk';

export interface FilterValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFilterExpression(filterExpression: string): FilterValidationResult {
  const trimmed = filterExpression.trim();
  if (!trimmed) {
    return { valid: false, error: 'filterExpression is empty' };
  }
  const { ast, error } = parseExpressionToAst(trimmed);
  if (ast) {
    return { valid: true };
  }
  return {
    valid: validateExpressionSyntax(trimmed),
    error: error ?? 'Invalid FilterQL expression',
  };
}
