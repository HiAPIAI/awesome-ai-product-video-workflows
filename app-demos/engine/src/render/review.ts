import {createHash} from 'node:crypto';
import {mkdir, readFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import type {OutputSpec} from '../contracts/types.js';
import {runProcess} from './process.js';

export interface ReviewArtifacts {
  firstFrame: string;
  middleFrame: string;
  lastFrame: string;
  contactSheet: string;
  frameSha256: {
    first: string;
    middle: string;
    last: string;
  };
}
function portable(path: string): string {
  return path.replaceAll('\\', '/');
}

async function sha256(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function extractFrame(videoPath: string, frame: number, destination: string): Promise<void> {
  await runProcess('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    videoPath,
    '-vf',
    `select=eq(n\\,${frame})`,
    '-frames:v',
    '1',
    '-fps_mode',
    'passthrough',
    '-threads',
    '1',
    destination,
  ]);
}

export async function createReviewArtifacts(
  videoPath: string,
  output: OutputSpec,
  expectedFrames: number,
  outputDirectory: string,
): Promise<ReviewArtifacts> {
  const reviewDirectory = join(outputDirectory, 'review', output.id);
  await mkdir(reviewDirectory, {recursive: true});
  const firstFrame = join(reviewDirectory, 'first.png');
  const middleFrame = join(reviewDirectory, 'middle.png');
  const lastFrame = join(reviewDirectory, 'last.png');
  const contactSheet = join(reviewDirectory, 'contact-sheet.jpg');
  const middle = Math.floor((expectedFrames - 1) / 2);
  const last = expectedFrames - 1;

  await extractFrame(videoPath, 0, firstFrame);
  await extractFrame(videoPath, middle, middleFrame);
  await extractFrame(videoPath, last, lastFrame);
  const thumbnailWidth = Math.min(640, Math.max(160, Math.floor(output.width / 3)));
  await runProcess('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    videoPath,
    '-vf',
    `select=eq(n\\,0)+eq(n\\,${middle})+eq(n\\,${last}),scale=${thumbnailWidth}:-2,tile=3x1`,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    '-threads',
    '1',
    contactSheet,
  ]);

  return {
    firstFrame: portable(relative(outputDirectory, firstFrame)),
    middleFrame: portable(relative(outputDirectory, middleFrame)),
    lastFrame: portable(relative(outputDirectory, lastFrame)),
    contactSheet: portable(relative(outputDirectory, contactSheet)),
    frameSha256: {
      first: await sha256(firstFrame),
      middle: await sha256(middleFrame),
      last: await sha256(lastFrame),
    },
  };
}
