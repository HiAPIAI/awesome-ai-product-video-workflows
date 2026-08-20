import type {OutputSpec} from '../contracts/types.js';
import {runProcess} from './process.js';

interface ProbeStream {
  codec_type?: string;
  codec_name?: string;
  pix_fmt?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  duration?: string;
  nb_read_frames?: string;
}
interface ProbeDocument {
  streams?: ProbeStream[];
  format?: {duration?: string};
}

export interface MediaValidation {
  passed: true;
  videoCodec: 'h264';
  pixelFormat: 'yuv420p';
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  durationSeconds: number;
  audioCodec?: 'aac';
}

function parseRate(value: string | undefined): number {
  if (!value) return Number.NaN;
  const [numerator, denominator = '1'] = value.split('/');
  return Number(numerator) / Number(denominator);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`FFprobe validation failed: ${label} is ${String(actual)}, expected ${String(expected)}.`);
}

export async function probeAndValidate(
  path: string,
  output: OutputSpec,
  expectedFrames: number,
  expectedDurationSeconds: number,
  expectAudio: boolean,
): Promise<MediaValidation> {
  const result = await runProcess('ffprobe', [
    '-v',
    'error',
    '-count_frames',
    '-show_streams',
    '-show_format',
    '-of',
    'json',
    path,
  ]);
  const document = JSON.parse(result.stdout) as ProbeDocument;
  const video = document.streams?.find((stream) => stream.codec_type === 'video');
  const audio = document.streams?.find((stream) => stream.codec_type === 'audio');
  if (!video) throw new Error('FFprobe validation failed: no video stream.');
  assertEqual(video.codec_name, 'h264', 'video codec');
  assertEqual(video.pix_fmt, 'yuv420p', 'pixel format');
  assertEqual(video.width, output.width, 'width');
  assertEqual(video.height, output.height, 'height');
  const frameCount = Number(video.nb_read_frames);
  assertEqual(frameCount, expectedFrames, 'frame count');
  const fps = parseRate(video.avg_frame_rate ?? video.r_frame_rate);
  if (Math.abs(fps - output.fps) > 0.001) {
    throw new Error(`FFprobe validation failed: fps is ${fps}, expected ${output.fps}.`);
  }
  const durationSeconds = Number(video.duration ?? document.format?.duration);
  if (!Number.isFinite(durationSeconds) || Math.abs(durationSeconds - expectedDurationSeconds) > 1 / output.fps) {
    throw new Error(
      `FFprobe validation failed: duration is ${durationSeconds}, expected ${expectedDurationSeconds} seconds.`,
    );
  }
  if (expectAudio) assertEqual(audio?.codec_name, 'aac', 'audio codec');
  if (!expectAudio && audio) throw new Error('FFprobe validation failed: unexpected audio stream.');

  return {
    passed: true,
    videoCodec: 'h264',
    pixelFormat: 'yuv420p',
    width: output.width,
    height: output.height,
    fps: output.fps,
    frameCount,
    durationSeconds,
    ...(expectAudio ? {audioCodec: 'aac' as const} : {}),
  };
}
