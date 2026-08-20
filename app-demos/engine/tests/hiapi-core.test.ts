import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import http, {type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  bindApiIdentity,
  downloadOutput,
  ensurePendingJournal,
  pendingJournalPath,
  prepareHiapiRequest,
  readHiapiRequestFile,
} from '../src/hiapi/index.js';
import type {HiapiRequest} from '../src/contracts/types.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const fakeKey = 'mock-only-secret-api-key';

test('preflight is deterministic and changes with the exact body or endpoint', () => {
  const request = requestFixture();
  const first = prepareHiapiRequest(request);
  const second = prepareHiapiRequest(structuredClone(request));
  const changedBody = structuredClone(request);
  (changedBody.body.input as Record<string, unknown>).prompt = 'Changed prompt';
  const local = prepareHiapiRequest(request, 'http://127.0.0.1:43210');
  assert.equal(first.preflightToken, second.preflightToken);
  assert.notEqual(first.preflightToken, prepareHiapiRequest(changedBody).preflightToken);
  assert.notEqual(first.preflightToken, local.preflightToken);
  assert.equal(first.summary.bodySha256, first.requestHash);
  assert.equal(JSON.stringify(first.summary).includes(fakeKey), false);
});

test('dry-run neither needs a key nor contacts the configured server', async () => {
  const directory = makeDirectory('app-demo-hiapi-dry-');
  let requests = 0;
  const mock = await startServer((_request, response) => {
    requests += 1;
    response.statusCode = 500;
    response.end();
  });
  try {
    const requestFile = writeRequest(directory);
    const output = path.join(directory, 'output-does-not-exist');
    const result = await runGenerate([
      '--request', requestFile,
      '--out-dir', output,
      '--base-url', mock.baseUrl,
    ], withoutRealKey());
    assert.equal(result.code, 0, result.stderr);
    assert.equal(requests, 0);
    assert.equal(fs.existsSync(output), false);
    assert.match(result.stdout, /"dryRun": true/);
    assert.match(result.stdout, /preflightToken/);
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('confirmed CLI journals before POST, uses idempotency, polls, downloads, and never exposes the key', async () => {
  const directory = makeDirectory('app-demo-hiapi-success-');
  const output = path.join(directory, 'output');
  const requestFile = writeRequest(directory);
  let baseUrl = '';
  let pendingExistedBeforePost = false;
  let idempotencyHeader = '';
  let postedBody = '';
  const preparedHolder: {token?: string} = {};
  const mock = await startServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/v1/tasks') {
      pendingExistedBeforePost = Boolean(preparedHolder.token && fs.existsSync(pendingJournalPath(output, preparedHolder.token)));
      idempotencyHeader = String(request.headers['idempotency-key'] ?? '');
      postedBody = await readBody(request);
      json(response, 200, {data: {taskId: 'task-success'}});
      return;
    }
    if (request.url === '/v1/tasks/task-success') {
      json(response, 200, {data: {status: 'success', outputs: [{type: 'video', url: `${baseUrl}/video.mp4`}]} });
      return;
    }
    if (request.url === '/video.mp4') {
      response.setHeader('Content-Type', 'video/mp4');
      response.end(minimalMp4(7));
      return;
    }
    response.statusCode = 404;
    response.end();
  });
  baseUrl = mock.baseUrl;
  try {
    const prepared = prepareHiapiRequest(readHiapiRequestFile(requestFile), baseUrl);
    preparedHolder.token = prepared.preflightToken;
    const result = await runGenerate(confirmedArgs(requestFile, output, baseUrl, prepared.preflightToken), fakeEnvironment());
    assert.equal(result.code, 0, result.stderr);
    assert.equal(pendingExistedBeforePost, true);
    assert.equal(idempotencyHeader, prepared.preflightToken);
    assert.deepEqual(JSON.parse(postedBody), requestFixture().body);
    assert.deepEqual(fs.readFileSync(path.join(output, 'task-success.mp4')), minimalMp4(7));
    assert.equal(fs.existsSync(pendingJournalPath(output, prepared.preflightToken)), false);
    const download = JSON.parse(fs.readFileSync(path.join(output, 'task-success.download.json'), 'utf8')) as {sha256: string};
    assert.equal(download.sha256, createHash('sha256').update(minimalMp4(7)).digest('hex'));
    assertNoSecret(directory, `${result.stdout}\n${result.stderr}`, fakeKey);
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('ambiguous transport failure keeps pending state and retry reuses the same idempotency key', async () => {
  const directory = makeDirectory('app-demo-hiapi-retry-');
  const output = path.join(directory, 'output');
  const requestFile = writeRequest(directory);
  let baseUrl = '';
  let posts = 0;
  const keys: string[] = [];
  const mock = await startServer((request, response) => {
    if (request.method === 'POST') {
      posts += 1;
      keys.push(String(request.headers['idempotency-key'] ?? ''));
      request.resume();
      if (posts === 1) {
        request.socket.destroy();
        return;
      }
      request.on('end', () => json(response, 200, {data: {taskId: 'task-retry'}}));
      return;
    }
    if (request.url === '/v1/tasks/task-retry') {
      json(response, 200, {data: {status: 'success', output: [{type: 'video', url: `${baseUrl}/video.mp4`}]} });
      return;
    }
    response.setHeader('Content-Type', 'video/mp4');
    response.end(minimalMp4(8));
  });
  baseUrl = mock.baseUrl;
  try {
    const token = prepareHiapiRequest(readHiapiRequestFile(requestFile), baseUrl).preflightToken;
    const first = await runGenerate(confirmedArgs(requestFile, output, baseUrl, token), fakeEnvironment());
    assert.equal(first.code, 1);
    assert.equal(fs.existsSync(pendingJournalPath(output, token)), true);
    const second = await runGenerate(confirmedArgs(requestFile, output, baseUrl, token), fakeEnvironment());
    assert.equal(second.code, 0, second.stderr);
    assert.match(second.stdout, /Reusing the existing pending journal/);
    assert.deepEqual(keys, [token, token]);
    assert.equal(fs.existsSync(pendingJournalPath(output, token)), false);
    assertNoSecret(directory, `${first.stdout}${first.stderr}${second.stdout}${second.stderr}`, fakeKey);
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('definitive rejection removes pending state and redacts a malicious key echo', async () => {
  const directory = makeDirectory('app-demo-hiapi-reject-');
  const output = path.join(directory, 'output');
  const requestFile = writeRequest(directory);
  const mock = await startServer((request, response) => {
    request.resume();
    request.on('end', () => json(response, 401, {message: `invalid credential ${fakeKey}`}));
  });
  try {
    const token = prepareHiapiRequest(readHiapiRequestFile(requestFile), mock.baseUrl).preflightToken;
    const result = await runGenerate(confirmedArgs(requestFile, output, mock.baseUrl, token), fakeEnvironment());
    assert.equal(result.code, 1);
    assert.equal(fs.existsSync(pendingJournalPath(output, token)), false);
    assert.match(result.stderr, /HTTP 401/);
    assert.equal(result.stderr.includes(fakeKey), false);
    assertNoSecret(directory, result.stderr, fakeKey);
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('poll timeout leaves submitted state and resume completes without another POST', async () => {
  const directory = makeDirectory('app-demo-hiapi-resume-');
  const output = path.join(directory, 'output');
  const requestFile = writeRequest(directory);
  let baseUrl = '';
  let complete = false;
  let posts = 0;
  const mock = await startServer((request, response) => {
    if (request.method === 'POST') {
      posts += 1;
      request.resume();
      request.on('end', () => json(response, 200, {data: {taskId: 'task-resume'}}));
      return;
    }
    if (request.url === '/v1/tasks/task-resume') {
      json(response, 200, complete
        ? {data: {status: 'completed', output: {type: 'video', url: `${baseUrl}/video.mp4`}}}
        : {data: {status: 'processing'}});
      return;
    }
    response.setHeader('Content-Type', 'video/mp4');
    response.end(minimalMp4(9));
  });
  baseUrl = mock.baseUrl;
  try {
    const token = prepareHiapiRequest(readHiapiRequestFile(requestFile), baseUrl).preflightToken;
    const first = await runGenerate([
      ...confirmedArgs(requestFile, output, baseUrl, token),
      '--poll-timeout-ms', '60',
    ], fakeEnvironment());
    assert.equal(first.code, 1);
    assert.match(first.stderr, /--resume task-resume/);
    assert.equal(fs.existsSync(path.join(output, 'task-resume.submitted.json')), true);
    complete = true;
    const resumed = await runGenerate([
      '--resume', 'task-resume', '--out-dir', output,
      '--base-url', baseUrl, '--allow-custom-base-url',
      '--poll-interval-ms', '10', '--poll-timeout-ms', '500', '--request-timeout-ms', '500',
    ], fakeEnvironment());
    assert.equal(resumed.code, 0, resumed.stderr);
    assert.equal(posts, 1);
    assert.deepEqual(fs.readFileSync(path.join(output, 'task-resume.mp4')), minimalMp4(9));
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('409 duplicate response with a task id resumes safely instead of creating a new identity', async () => {
  const directory = makeDirectory('app-demo-hiapi-duplicate-');
  const output = path.join(directory, 'output');
  const requestFile = writeRequest(directory);
  let baseUrl = '';
  const mock = await startServer((request, response) => {
    if (request.method === 'POST') {
      request.resume();
      request.on('end', () => json(response, 409, {data: {taskId: 'task-duplicate'}, message: 'already exists'}));
      return;
    }
    if (request.url === '/v1/tasks/task-duplicate') {
      json(response, 200, {data: {status: 'success', output: {type: 'video', url: `${baseUrl}/video.mp4`}}});
      return;
    }
    response.setHeader('Content-Type', 'video/mp4');
    response.end(minimalMp4(10));
  });
  baseUrl = mock.baseUrl;
  try {
    const token = prepareHiapiRequest(readHiapiRequestFile(requestFile), baseUrl).preflightToken;
    const result = await runGenerate(confirmedArgs(requestFile, output, baseUrl, token), fakeEnvironment());
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /duplicate response/);
    const submitted = fs.readFileSync(path.join(output, 'task-duplicate.submitted.json'), 'utf8');
    assert.match(submitted, /"duplicateRecovered": true/);
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('terminal task failure is persisted in sanitized form for later diagnosis', async () => {
  const directory = makeDirectory('app-demo-hiapi-failure-');
  const output = path.join(directory, 'output');
  const requestFile = writeRequest(directory);
  const mock = await startServer((request, response) => {
    if (request.method === 'POST') {
      request.resume();
      request.on('end', () => json(response, 200, {data: {taskId: 'task-failure'}}));
      return;
    }
    json(response, 200, {data: {status: 'failed', error: {code: 'BAD_INPUT', message: `rejected ${fakeKey}`}}});
  });
  try {
    const token = prepareHiapiRequest(readHiapiRequestFile(requestFile), mock.baseUrl).preflightToken;
    const result = await runGenerate(confirmedArgs(requestFile, output, mock.baseUrl, token), fakeEnvironment());
    assert.equal(result.code, 1);
    assert.match(result.stderr, /BAD_INPUT/);
    const failureFile = path.join(output, 'task-failure.result.json');
    const failure = fs.readFileSync(failureFile, 'utf8');
    assert.match(failure, /"terminal": "failure"/);
    assert.match(failure, /\[REDACTED\]/);
    assertNoSecret(directory, `${result.stdout}${result.stderr}`, fakeKey);
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('pending journals bind the credential without persisting it and enforce the retry window', () => {
  const directory = makeDirectory('app-demo-hiapi-journal-');
  try {
    const token = 'a'.repeat(64);
    const file = pendingJournalPath(directory, token);
    const input = {
      endpoint: 'https://api.hiapi.ai/v1/tasks',
      preflightToken: token,
      requestHash: 'b'.repeat(64),
      apiIdentityBinding: bindApiIdentity(fakeKey, token),
    };
    const now = Date.parse('2026-07-30T00:00:00.000Z');
    assert.equal(ensurePendingJournal(file, input, now).reused, false);
    assert.equal(ensurePendingJournal(file, input, now + 22 * 60 * 60 * 1000).reused, true);
    assert.equal(fs.readFileSync(file, 'utf8').includes(fakeKey), false);
    assert.throws(() => ensurePendingJournal(file, input, now + 23 * 60 * 60 * 1000), /23-hour/);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('bounded MP4 download publishes atomically and removes invalid partial files', async () => {
  const directory = makeDirectory('app-demo-hiapi-download-');
  const mock = await startServer((request, response) => {
    response.setHeader('Content-Type', 'video/mp4');
    if (request.url === '/oversized') response.setHeader('Content-Length', '2048');
    response.end(request.url === '/invalid' ? Buffer.alloc(20) : minimalMp4(11));
  });
  try {
    const valid = path.join(directory, 'valid.mp4');
    const result = await downloadOutput(`${mock.baseUrl}/valid`, valid, {allowLocal: true, maxBytes: 1024, timeoutMs: 500});
    assert.equal(result.sha256, createHash('sha256').update(minimalMp4(11)).digest('hex'));
    await assert.rejects(downloadOutput(`${mock.baseUrl}/valid`, valid, {allowLocal: true, maxBytes: 1024, timeoutMs: 500}), /Refusing to replace/);
    await assert.rejects(downloadOutput(`${mock.baseUrl}/invalid`, path.join(directory, 'invalid.mp4'), {allowLocal: true, maxBytes: 1024, timeoutMs: 500}), /recognizable MP4/);
    await assert.rejects(downloadOutput(`${mock.baseUrl}/oversized`, path.join(directory, 'oversized.mp4'), {allowLocal: true, maxBytes: 1024, timeoutMs: 500}), /exceeds 1024 bytes/);
    assert.deepEqual(fs.readdirSync(directory).filter((name) => name.includes('.part-')), []);
    assert.equal(fs.existsSync(path.join(directory, 'invalid.mp4')), false);
  } finally {
    await stopServer(mock.server);
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

function requestFixture(): HiapiRequest {
  return {
    id: 'mock-background',
    endpoint: '/v1/tasks',
    model: 'mock-video-model',
    purpose: 'background',
    body: {model: 'mock-video-model', input: {prompt: 'A quiet abstract background'}},
  };
}

function writeRequest(directory: string): string {
  const file = path.join(directory, 'request.json');
  fs.writeFileSync(file, JSON.stringify(requestFixture()));
  return file;
}

function confirmedArgs(requestFile: string, output: string, baseUrl: string, token: string): string[] {
  return [
    '--request', requestFile, '--out-dir', output,
    '--base-url', baseUrl, '--allow-custom-base-url',
    '--confirm-preflight', token,
    '--poll-interval-ms', '10', '--poll-timeout-ms', '500', '--request-timeout-ms', '500',
  ];
}

function fakeEnvironment(): NodeJS.ProcessEnv {
  return {...withoutRealKey(), HIAPI_API_KEY: fakeKey};
}

function withoutRealKey(): NodeJS.ProcessEnv {
  const environment = {...process.env};
  delete environment.HIAPI_API_KEY;
  delete environment.HIAPI_BASE_URL;
  return environment;
}

function assertNoSecret(directory: string, output: string, secret: string): void {
  assert.equal(output.includes(secret), false);
  for (const file of walkFiles(directory)) {
    if (path.extname(file) === '.mp4') continue;
    assert.equal(fs.readFileSync(file, 'utf8').includes(secret), false, file);
  }
}

function walkFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(file) : [file];
  });
}

function minimalMp4(minorVersion = 0): Buffer {
  const box = Buffer.alloc(20);
  box.writeUInt32BE(box.length, 0);
  box.write('ftyp', 4, 'ascii');
  box.write('isom', 8, 'ascii');
  box.writeUInt32BE(minorVersion, 12);
  box.write('isom', 16, 'ascii');
  return box;
}

function makeDirectory(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function startServer(handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>): Promise<{server: Server; baseUrl: string}> {
  const server = http.createServer((request, response) => {
    Promise.resolve(handler(request, response)).catch((error: unknown) => {
      response.statusCode = 500;
      response.end(error instanceof Error ? error.message : String(error));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return {server, baseUrl: `http://127.0.0.1:${address.port}`};
}

async function stopServer(server: Server): Promise<void> {
  server.closeAllConnections?.();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function readBody(request: IncomingMessage): Promise<string> {
  request.setEncoding('utf8');
  let value = '';
  for await (const chunk of request) value += String(chunk);
  return value;
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(value));
}

async function runGenerate(args: string[], env: NodeJS.ProcessEnv): Promise<{code: number | null; stdout: string; stderr: string}> {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', path.join(root, 'src', 'cli', 'generate.ts'), ...args], {
      cwd: root,
      env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({code, stdout, stderr}));
  });
}
