import {spawnSync} from 'node:child_process';
import {parseArgs} from 'node:util';
import {assertSchemasLoad} from '../compiler/schema.js';
import {checkFfmpegFilterSync} from '../render/tools.js';
import {fail} from './common.js';

try {
  const {values} = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: false,
    strict: true,
    options: {
      help: {type: 'boolean', short: 'h'},
      strict: {type: 'boolean'},
    },
  });
  if (values.help) {
    console.log('Usage: npm run doctor -- [--strict]');
    process.exit(0);
  }

  const checks = [
    checkNode(),
    checkSchemas(),
    checkExecutable('ffmpeg'),
    checkFfmpegFilter('drawtext'),
    checkExecutable('ffprobe'),
  ];
  console.log(JSON.stringify({
    ok: checks.every((check) => check.ok),
    strict: values.strict ?? false,
    hiapiApiKeyConfigured: Boolean(process.env.HIAPI_API_KEY?.trim()),
    checks,
  }, null, 2));
  const requiredFailed = checks.some((check) => !check.ok && (values.strict || check.required));
  if (requiredFailed) process.exitCode = 1;
} catch (error) {
  fail(error);
}

interface DoctorCheck {
  name: string;
  ok: boolean;
  required: boolean;
  detail: string;
}

function checkNode(): DoctorCheck {
  const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
  const ok = major > 20 || (major === 20 && minor >= 18);
  return {name: 'node', ok, required: true, detail: process.versions.node};
}

function checkSchemas(): DoctorCheck {
  try {
    assertSchemasLoad();
    return {name: 'schemas', ok: true, required: true, detail: 'demo-v1 and compiled-demo-v1 loaded'};
  } catch (error) {
    return {name: 'schemas', ok: false, required: true, detail: error instanceof Error ? error.message : String(error)};
  }
}

function checkExecutable(command: string): DoctorCheck {
  const result = spawnSync(command, ['-version'], {encoding: 'utf8', timeout: 5000, windowsHide: true});
  const firstLine = `${result.stdout || result.stderr || ''}`.split(/\r?\n/, 1)[0]?.trim();
  return {
    name: command,
    ok: result.status === 0 && !result.error,
    required: false,
    detail: result.error?.message ?? firstLine ?? 'unavailable',
  };
}

function checkFfmpegFilter(filter: string): DoctorCheck {
  const check = checkFfmpegFilterSync(filter);
  return {
    name: `ffmpeg-filter:${filter}`,
    ok: check.ok,
    required: false,
    detail: check.detail,
  };
}
