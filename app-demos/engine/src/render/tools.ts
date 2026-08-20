import {spawnSync} from 'node:child_process';
import {runProcess} from './process.js';

const ACTIONABLE_DRAW_TEXT_DETAIL =
  'Install an FFmpeg build with the drawtext filter (libfreetype), then rerun `npm run doctor -- --strict`.';

export interface FfmpegFilterCheck {
  ok: boolean;
  detail: string;
}

function filterPattern(filter: string): RegExp {
  const escaped = filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s+\\S+\\s+${escaped}(?:\\s|$)`, 'mu');
}

function hasFilter(output: string, filter: string): boolean {
  return filterPattern(filter).test(output);
}

export function checkFfmpegFilterSync(filter: string): FfmpegFilterCheck {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-filters'], {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      detail: result.error?.message ?? 'ffmpeg did not return its filter list.',
    };
  }
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (!hasFilter(output, filter)) {
    return {ok: false, detail: ACTIONABLE_DRAW_TEXT_DETAIL};
  }
  return {ok: true, detail: `ffmpeg filter available: ${filter}`};
}

export async function assertFfmpegFilter(filter: string): Promise<void> {
  let result;
  try {
    result = await runProcess('ffmpeg', ['-hide_banner', '-filters']);
  } catch (error) {
    throw new Error(
      `Rendering requires the ffmpeg ${filter} filter, but ffmpeg could not be inspected. ` +
      `${ACTIONABLE_DRAW_TEXT_DETAIL} ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!hasFilter(`${result.stdout}\n${result.stderr}`, filter)) {
    throw new Error(`Rendering requires the ffmpeg ${filter} filter. ${ACTIONABLE_DRAW_TEXT_DETAIL}`);
  }
}

