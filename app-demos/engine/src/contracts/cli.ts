export const CLI_CONTRACTS = {
  doctor: 'doctor [--strict]',
  validate: 'validate <demo.yaml>',
  compile: 'compile <demo.yaml> --out-dir <directory>',
  render: 'render --compiled <compiled-demo-v1.json> --out-dir <directory>',
  generate: 'generate --request <hiapi-request.json> --out-dir <directory> [--confirm-preflight <token>]',
} as const;

export type CliName = keyof typeof CLI_CONTRACTS;
