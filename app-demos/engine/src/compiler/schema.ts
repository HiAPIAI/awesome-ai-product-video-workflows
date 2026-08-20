import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Ajv2020, type AnySchema, type ErrorObject, type ValidateFunction} from 'ajv/dist/2020.js';
import type {CompiledDemoV1, DemoV1} from '../contracts/types.js';
import type {ValidationIssue} from './errors.js';

const sourceSchema = readSchema('../../schemas/demo-v1.schema.json');
const compiledSchema = readSchema('../../schemas/compiled-demo-v1.schema.json');
const ajv = new Ajv2020({allErrors: true, strict: true, useDefaults: false});
const sourceValidator = ajv.compile<DemoV1>(sourceSchema);
const compiledValidator = ajv.compile<CompiledDemoV1>(compiledSchema);

export type SchemaValidation<T> =
  | {valid: true; value: T; issues: []}
  | {valid: false; issues: ValidationIssue[]};

export function validateSourceSchema(value: unknown): SchemaValidation<DemoV1> {
  return result(sourceValidator, value);
}

export function validateCompiledSchema(value: unknown): SchemaValidation<CompiledDemoV1> {
  return result(compiledValidator, value);
}

export function assertSchemasLoad(): void {
  if (!sourceValidator || !compiledValidator) throw new Error('JSON Schema validators are unavailable.');
}

function readSchema(relativeUrl: string): AnySchema {
  return JSON.parse(readFileSync(fileURLToPath(new URL(relativeUrl, import.meta.url)), 'utf8')) as AnySchema;
}

function result<T>(validator: ValidateFunction<T>, value: unknown): SchemaValidation<T> {
  const valid = validator(value);
  return valid
    ? {valid: true, value: value as T, issues: []}
    : {valid: false, issues: formatAjvIssues(validator.errors ?? [])};
}

function formatAjvIssues(errors: ErrorObject[]): ValidationIssue[] {
  return errors.map((error) => ({
    path: error.instancePath || '/',
    message: error.message ?? 'is invalid',
  }));
}
