import {createHash} from 'node:crypto';
import {mkdir, mkdtemp, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';
import {buildFfmpegComposition} from '../compositions/ffmpeg-composition.js';
import type {OutputSpec} from '../contracts/types.js';
import {resolveAndVerifyAssets} from '../media/assets.js';
import {resolveRenderFont} from '../media/font.js';
import {createCursorRgba, CURSOR_RGBA_SIZE} from '../media/generated.js';
import {rasterizeSvgAssets} from '../media/rasterize.js';
import {loadCompiledDemo} from './compiled.js';
import {probeAndValidate} from './probe.js';
import {runProcess} from './process.js';
import {
  writeRenderReport,
  writeReviewChecklist,
  type RenderedOutputReport,
  type RenderReport,
} from './report.js';
import {createReviewArtifacts} from './review.js';
import {assertFfmpegFilter} from './tools.js';

export interface RenderProjectOptions {
  compiledPath: string;
  outputDirectory: string;
  workingDirectory?: string;
  onProgress?: (message: string) => void;
}

function portable(path: string): string {
  return path.replaceAll('\\', '/');
}

async function sha256(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function aspectRatio(output: OutputSpec): string {
  const divisor = greatestCommonDivisor(output.width, output.height);
  return `${output.width / divisor}:${output.height / divisor}`;
}

async function toolVersion(command: 'ffmpeg' | 'ffprobe'): Promise<string> {
  const result = await runProcess(command, ['-version']);
  return result.stdout.split(/\r?\n/u)[0]?.trim() ?? command;
}

async function encodeOutput(
  composition: ReturnType<typeof buildFfmpegComposition>,
  output: OutputSpec,
  graphPath: string,
  destination: string,
): Promise<void> {
  const filterGraph = await readFile(graphPath, 'utf8');
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    ...composition.inputArgs,
    '-filter_complex',
    filterGraph,
    '-map',
    composition.videoLabel,
    ...(composition.audioLabel ? ['-map', composition.audioLabel] : []),
    '-frames:v',
    String(composition.expectedFrames),
    '-fps_mode',
    'cfr',
    '-r',
    String(output.fps),
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-threads',
    '1',
    '-map_metadata',
    '-1',
    '-movflags',
    '+faststart',
    ...(composition.audioLabel ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] : ['-an']),
    destination,
  ];
  await runProcess('ffmpeg', args);
}

export async function renderProject(options: RenderProjectOptions): Promise<RenderReport> {
  const outputDirectory = resolve(options.outputDirectory);
  const workingDirectory = resolve(options.workingDirectory ?? process.cwd());
  const progress = options.onProgress ?? (() => undefined);
  await assertFfmpegFilter('drawtext');
  await mkdir(outputDirectory, {recursive: true});
  const workDirectory = await mkdtemp(join(outputDirectory, '.render-work-'));

  try {
    progress('Loading compiled-demo-v1 and verifying local assets...');
    const [loaded, fontPath, ffmpegVersion, ffprobeVersion] = await Promise.all([
      loadCompiledDemo(options.compiledPath),
      resolveRenderFont(),
      toolVersion('ffmpeg'),
      toolVersion('ffprobe'),
    ]);
    const verifiedAssets = await resolveAndVerifyAssets(loaded.compiled, loaded.path, workingDirectory);
    const assets = await rasterizeSvgAssets(verifiedAssets, join(workDirectory, 'rasterized-assets'));
    const cursorPath = join(workDirectory, 'cursor.rgba');
    await writeFile(cursorPath, createCursorRgba());
    const renderedOutputs: RenderedOutputReport[] = [];

    for (const output of loaded.compiled.outputs) {
      progress(`Rendering ${output.id} (${output.width}x${output.height} @ ${output.fps} fps)...`);
      const textDirectory = join(workDirectory, 'text', output.id);
      await mkdir(textDirectory, {recursive: true});
      const composition = buildFfmpegComposition({
        compiled: loaded.compiled,
        output,
        assets,
        textDirectory,
        cursorPath,
        cursorSize: CURSOR_RGBA_SIZE,
        fontPath,
      });
      await Promise.all(
        composition.textFiles.map(async (textFile) => {
          await writeFile(textFile.path, textFile.contents, 'utf8');
        }),
      );
      const graphPath = join(workDirectory, `${output.id}.filtergraph`);
      const videoPath = join(workDirectory, output.fileName);
      await writeFile(graphPath, composition.filterGraph, 'utf8');
      await encodeOutput(composition, output, graphPath, videoPath);
      const validation = await probeAndValidate(
        videoPath,
        output,
        composition.expectedFrames,
        composition.durationSeconds,
        composition.audioLabel !== undefined,
      );
      const review = await createReviewArtifacts(
        videoPath,
        output,
        composition.expectedFrames,
        workDirectory,
      );
      renderedOutputs.push({
        id: output.id,
        file: portable(relative(workDirectory, videoPath)),
        sha256: await sha256(videoPath),
        aspectRatio: aspectRatio(output),
        validation,
        review,
        features: composition.features,
      });
    }

    const report: RenderReport = {
      schemaVersion: 'render-report-v1',
      projectId: loaded.compiled.project.id,
      compiledSha256: loaded.sha256,
      animationClock: 'frame-number',
      criticalUiPipeline: 'deterministic-local-layers',
      generativeUiPasses: 0,
      tools: {ffmpeg: ffmpegVersion, ffprobe: ffprobeVersion},
      outputs: renderedOutputs,
    };
    await writeRenderReport(workDirectory, report);
    await writeReviewChecklist(workDirectory, report);

    progress('Publishing validated render artifacts...');
    await mkdir(join(outputDirectory, 'review'), {recursive: true});
    for (const output of loaded.compiled.outputs) {
      const destinationVideo = join(outputDirectory, output.fileName);
      await rm(destinationVideo, {force: true});
      await rename(join(workDirectory, output.fileName), destinationVideo);
      const destinationReview = join(outputDirectory, 'review', output.id);
      await rm(destinationReview, {recursive: true, force: true});
      await rename(join(workDirectory, 'review', output.id), destinationReview);
    }
    for (const artifact of ['render-report.json', 'review-checklist.md']) {
      const destination = join(outputDirectory, artifact);
      await rm(destination, {force: true});
      await rename(join(workDirectory, artifact), destination);
    }
    progress(`Render complete: ${outputDirectory}`);
    return report;
  } finally {
    await rm(workDirectory, {recursive: true, force: true});
  }
}
