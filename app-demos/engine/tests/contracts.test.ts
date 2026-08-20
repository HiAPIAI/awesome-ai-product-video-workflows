import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {Ajv2020, type AnySchema} from 'ajv/dist/2020.js';
import {parse} from 'yaml';
import {CLI_CONTRACTS} from '../src/contracts/cli.js';

const root = fileURLToPath(new URL('..', import.meta.url));

async function readJson<T = unknown>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(new URL(relativePath, new URL('../', import.meta.url)), 'utf8')) as T;
}

test('source and compiled schemas accept their bootstrap fixtures', async () => {
  const [sourceSchema, compiledSchema, sourceYaml, compiledFixture] = await Promise.all([
    readJson<AnySchema>('schemas/demo-v1.schema.json'),
    readJson<AnySchema>('schemas/compiled-demo-v1.schema.json'),
    readFile(`${root}/tests/fixtures/demo-v1/minimal/demo.yaml`, 'utf8'),
    readJson('tests/fixtures/compiled-demo-v1/minimal.json'),
  ]);

  const ajv = new Ajv2020({allErrors: true, strict: true});
  const validateSource = ajv.compile(sourceSchema);
  const validateCompiled = ajv.compile(compiledSchema);

  assert.equal(validateSource(parse(sourceYaml)), true, JSON.stringify(validateSource.errors));
  assert.equal(validateCompiled(compiledFixture), true, JSON.stringify(validateCompiled.errors));
});

test('schema versions and CLI contracts stay frozen', () => {
  assert.deepEqual(CLI_CONTRACTS, {
    doctor: 'doctor [--strict]',
    validate: 'validate <demo.yaml>',
    compile: 'compile <demo.yaml> --out-dir <directory>',
    render: 'render --compiled <compiled-demo-v1.json> --out-dir <directory>',
    generate: 'generate --request <hiapi-request.json> --out-dir <directory> [--confirm-preflight <token>]',
  });
});
