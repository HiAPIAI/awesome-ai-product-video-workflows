import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {
  HiapiTaskFailureError,
  assertSafeBaseUrl,
  assertTrustedApiTarget,
  bindApiIdentity,
  createTask,
  downloadOutput,
  ensureOutputDirectory,
  ensurePendingJournal,
  extractOutputUrl,
  isDefinitiveSubmissionFailure,
  normalizeApiKey,
  normalizeTaskId,
  pendingJournalPath,
  prepareHiapiRequest,
  readHiapiRequestFile,
  sanitizeValue,
  waitForTask,
  writeJsonArtifact,
} from '../hiapi/index.js';
import {displayPath, fail} from './common.js';

const usage = [
  'Usage:',
  '  npm run generate -- --request <hiapi-request.json> --out-dir <directory>',
  '  npm run generate -- --request <hiapi-request.json> --out-dir <directory> --confirm-preflight <token>',
  '  npm run generate -- --resume <task-id> --out-dir <directory>',
].join('\n');

try {
  const {values, positionals} = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: false,
    strict: true,
    options: {
      help: {type: 'boolean', short: 'h'},
      request: {type: 'string'},
      'out-dir': {type: 'string'},
      'confirm-preflight': {type: 'string'},
      resume: {type: 'string'},
      'base-url': {type: 'string'},
      'allow-custom-base-url': {type: 'boolean'},
      'poll-interval-ms': {type: 'string'},
      'poll-timeout-ms': {type: 'string'},
      'request-timeout-ms': {type: 'string'},
    },
  });
  if (values.help) {
    console.log(usage);
    process.exit(0);
  }
  if (positionals.length > 0 || !values['out-dir']) throw new Error(`--out-dir is required and positional arguments are not accepted.\n${usage}`);

  const baseUrl = assertSafeBaseUrl(values['base-url'] ?? process.env.HIAPI_BASE_URL ?? 'https://api.hiapi.ai');
  const allowCustom = values['allow-custom-base-url'] ?? false;
  const pollOptions = {
    pollIntervalMs: optionalInteger(values['poll-interval-ms'], 'poll interval'),
    pollTimeoutMs: optionalInteger(values['poll-timeout-ms'], 'poll timeout'),
    timeoutMs: optionalInteger(values['request-timeout-ms'], 'request timeout'),
  };

  if (values.resume) {
    if (values.request || values['confirm-preflight']) throw new Error(`--resume cannot be combined with --request or --confirm-preflight.\n${usage}`);
    assertTrustedApiTarget(baseUrl, allowCustom);
    const outputDirectory = ensureOutputDirectory(values['out-dir']);
    const apiKey = normalizeApiKey(process.env.HIAPI_API_KEY);
    await finishTask(normalizeTaskId(values.resume), outputDirectory, baseUrl, apiKey, pollOptions);
  } else {
    if (!values.request) throw new Error(`--request is required unless --resume is used.\n${usage}`);
    const request = readHiapiRequestFile(values.request);
    const prepared = prepareHiapiRequest(request, baseUrl);
    console.log(JSON.stringify({dryRun: !values['confirm-preflight'], ...prepared.summary, preflightToken: prepared.preflightToken}, null, 2));
    if (!values['confirm-preflight']) {
      console.log(`Dry run only. To create exactly this paid task, repeat with --confirm-preflight ${prepared.preflightToken}`);
    } else {
      if (values['confirm-preflight'] !== prepared.preflightToken) throw new Error('Preflight token mismatch. Run a fresh dry run after every request or endpoint change.');
      assertTrustedApiTarget(baseUrl, allowCustom);
      const outputDirectory = ensureOutputDirectory(values['out-dir']);
      const apiKey = normalizeApiKey(process.env.HIAPI_API_KEY);
      const pendingFile = pendingJournalPath(outputDirectory, prepared.preflightToken);
      const pending = ensurePendingJournal(pendingFile, {
        endpoint: prepared.endpoint,
        preflightToken: prepared.preflightToken,
        requestHash: prepared.requestHash,
        apiIdentityBinding: bindApiIdentity(apiKey, prepared.preflightToken),
      });
      console.log(pending.reused
        ? 'Reusing the existing pending journal and idempotency key within the 23-hour retry window.'
        : 'Created a pending submission journal before POST.');

      let created: Awaited<ReturnType<typeof createTask>>;
      try {
        created = await createTask(prepared.request.body, {
          baseUrl,
          apiKey,
          idempotencyKey: prepared.preflightToken,
          ...(pollOptions.timeoutMs === undefined ? {} : {timeoutMs: pollOptions.timeoutMs}),
        });
      } catch (error) {
        if (isDefinitiveSubmissionFailure(error)) {
          fs.rmSync(pendingFile, {force: true});
          console.error('Removed the pending journal after a definitive client rejection; no ambiguous paid submission remains.');
        }
        throw error;
      }
      writeJsonArtifact(path.join(outputDirectory, `${created.taskId}.submitted.json`), {
        schemaVersion: 'hiapi-submitted-v1',
        taskId: created.taskId,
        preflightToken: prepared.preflightToken,
        duplicateRecovered: created.duplicate,
        response: sanitizeValue(created.response, [apiKey]),
      });
      fs.rmSync(pendingFile, {force: true});
      console.log(`Task ${created.taskId} accepted${created.duplicate ? ' from a duplicate response' : ''}; pending journal cleared.`);
      await finishTask(created.taskId, outputDirectory, baseUrl, apiKey, pollOptions);
    }
  }
} catch (error) {
  fail(error);
}

interface PollOptions {
  pollIntervalMs: number | undefined;
  pollTimeoutMs: number | undefined;
  timeoutMs: number | undefined;
}

async function finishTask(taskId: string, outputDirectory: string, baseUrl: string, apiKey: string, options: PollOptions): Promise<void> {
  let response: unknown;
  try {
    response = await waitForTask(taskId, {
      baseUrl,
      apiKey,
      ...(options.pollIntervalMs === undefined ? {} : {pollIntervalMs: options.pollIntervalMs}),
      ...(options.pollTimeoutMs === undefined ? {} : {pollTimeoutMs: options.pollTimeoutMs}),
      ...(options.timeoutMs === undefined ? {} : {timeoutMs: options.timeoutMs}),
    }, (status) => console.log(JSON.stringify({taskId, status})));
  } catch (error) {
    if (error instanceof HiapiTaskFailureError) {
      writeJsonArtifact(path.join(outputDirectory, `${taskId}.result.json`), {
        schemaVersion: 'hiapi-result-v1',
        taskId,
        terminal: 'failure',
        response: sanitizeValue(error.taskResponse, [apiKey]),
      });
    }
    throw error;
  }
  writeJsonArtifact(path.join(outputDirectory, `${taskId}.result.json`), {
    schemaVersion: 'hiapi-result-v1',
    taskId,
    terminal: 'success',
    response: sanitizeValue(response, [apiKey]),
  });
  const outputUrl = extractOutputUrl(response);
  if (!outputUrl) throw new Error(`HiAPI task ${taskId} completed without an MP4 output URL.`);
  const destination = path.join(outputDirectory, `${taskId}.mp4`);
  const downloaded = await downloadOutput(outputUrl, destination, {allowLocal: new URL(baseUrl).protocol === 'http:'});
  writeJsonArtifact(path.join(outputDirectory, `${taskId}.download.json`), {
    schemaVersion: 'hiapi-download-v1',
    taskId,
    fileName: path.basename(downloaded.destination),
    bytes: downloaded.bytes,
    sha256: downloaded.sha256,
  });
  console.log(JSON.stringify({downloaded: true, taskId, file: displayPath(destination), bytes: downloaded.bytes, sha256: downloaded.sha256, reviewRequired: true}, null, 2));
}

function optionalInteger(value: string | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!/^[0-9]+$/.test(value)) throw new Error(`Invalid ${label}.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`Invalid ${label}.`);
  return parsed;
}
