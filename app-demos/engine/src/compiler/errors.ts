export interface ValidationIssue {
  path: string;
  message: string;
}

export class DemoValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[], message = 'Demo validation failed.') {
    super(message);
    this.name = 'DemoValidationError';
    this.issues = issues;
  }
}

export function formatValidationError(error: DemoValidationError): string {
  return [error.message, ...error.issues.map((issue) => `- ${issue.path}: ${issue.message}`)].join('\n');
}
