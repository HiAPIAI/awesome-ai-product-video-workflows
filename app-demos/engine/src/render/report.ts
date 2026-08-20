import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {CompositionFeatures} from '../compositions/ffmpeg-composition.js';
import type {MediaValidation} from './probe.js';
import type {ReviewArtifacts} from './review.js';

export interface RenderedOutputReport {
  id: string;
  file: string;
  sha256: string;
  aspectRatio: string;
  validation: MediaValidation;
  review: ReviewArtifacts;
  features: CompositionFeatures;
}
export interface RenderReport {
  schemaVersion: 'render-report-v1';
  projectId: string;
  compiledSha256: string;
  animationClock: 'frame-number';
  criticalUiPipeline: 'deterministic-local-layers';
  generativeUiPasses: 0;
  tools: {ffmpeg: string; ffprobe: string};
  outputs: RenderedOutputReport[];
}

export async function writeRenderReport(outputDirectory: string, report: RenderReport): Promise<void> {
  await writeFile(join(outputDirectory, 'render-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

export async function writeReviewChecklist(outputDirectory: string, report: RenderReport): Promise<void> {
  const lines = [
    '# Render review checklist',
    '',
    `Project: ${report.projectId}`,
    '',
    '- [x] Animation timing is derived from frame numbers.',
    '- [x] Critical UI, text, cursor, and callout layers stayed in the deterministic local pipeline.',
    '- [x] No generative pass redrew UI or text.',
    '- [x] FFprobe validation passed for every output.',
    '- [ ] Watch every output from start to finish.',
    '- [ ] Confirm UI text is legible and no important controls are cropped.',
    '- [ ] Confirm cursor targets, click ripples, callouts, captions, and transitions are correctly timed.',
    '- [ ] Confirm audio levels and fades are acceptable on speakers and headphones.',
    '',
    '## Outputs',
    '',
  ];
  for (const output of report.outputs) {
    const audio = output.validation.audioCodec ? `, audio=${output.validation.audioCodec}` : ', no audio';
    lines.push(
      `- [x] ${output.id}: ${output.validation.width}x${output.validation.height}, ` +
        `${output.validation.fps} fps, ${output.validation.frameCount} frames, ` +
        `${output.validation.videoCodec}/${output.validation.pixelFormat}${audio}`,
      `- [ ] Review contact sheet: ${output.review.contactSheet}`,
    );
  }
  lines.push('');
  await writeFile(join(outputDirectory, 'review-checklist.md'), `${lines.join('\n')}\n`, 'utf8');
}
