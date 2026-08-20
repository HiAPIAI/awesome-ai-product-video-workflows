import {join} from 'node:path';
import type {
  AudioTrackSpec,
  CompiledDemoV1,
  CompiledScene,
  Easing,
  FitMode,
  OutputSpec,
  Transition,
} from '../contracts/types.js';
import type {ResolvedAsset} from '../media/assets.js';
import {CURSOR_RGBA_HOTSPOT} from '../media/generated.js';
import {
  TRANSITION_FRAMES,
  clamp,
  interpolateExpression,
  interpolateFrame,
  transformValue,
  transitionScaleAtFrame,
  transitionScaleExpression,
} from './frame-math.js';
import {
  comparisonRects,
  mapPointThroughVisual,
  screenRect,
  titleTextLayout,
  visualFitTransform,
  visualFocusPoint,
  type ContentRect,
  type VisualFitTransform,
} from './layout.js';

export interface TextFileSpec {
  path: string;
  contents: string;
}

export interface CompositionFeatures {
  screenshotTransform: boolean;
  crop: boolean;
  deviceFrame: boolean;
  cursor: boolean;
  clickRipple: boolean;
  callout: boolean;
  caption: boolean;
  transition: boolean;
}

export interface FfmpegComposition {
  inputArgs: string[];
  filterGraph: string;
  videoLabel: '[vout]';
  audioLabel?: '[aout]';
  textFiles: TextFileSpec[];
  expectedFrames: number;
  durationSeconds: number;
  features: CompositionFeatures;
}

interface CompositionOptions {
  compiled: CompiledDemoV1;
  output: OutputSpec;
  assets: ReadonlyMap<string, ResolvedAsset>;
  textDirectory: string;
  cursorPath: string;
  cursorSize: number;
  fontPath: string;
}

function color(value: string, label: string): string {
  if (!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value)) {
    throw new Error(`${label} must be a six- or eight-digit hexadecimal color.`);
  }
  return `0x${value.slice(1)}`;
}

function filterPath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^([a-z]):/i, '$1\\:').replaceAll("'", "\\'");
}

function frameAtOutput(frame: number, sourceFps: number, outputFps: number): number {
  return Math.round((frame * outputFps) / sourceFps);
}

function decimal(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function assetInputArgs(asset: ResolvedAsset, fps: number): string[] {
  if (asset.type === 'image') {
    return ['-loop', '1', '-framerate', String(fps), '-i', asset.absolutePath];
  }
  if (asset.type === 'video') {
    return ['-stream_loop', '-1', '-i', asset.absolutePath];
  }
  throw new Error(`Asset ${asset.id} cannot be used as a visual layer because it is ${asset.type}.`);
}

function fitFilters(rect: ContentRect, fit: FitMode, focus?: {x: number; y: number}): string[] {
  const size = `w=${rect.width}:h=${rect.height}`;
  if (fit === 'fill') {
    return [`scale=${size}`];
  }
  if (fit === 'cover') {
    const crop = focus
      ? `crop=w=${rect.width}:h=${rect.height}:` +
        `x='max(0,min(iw-ow,iw*${decimal(focus.x)}-ow/2))':` +
        `y='max(0,min(ih-oh,ih*${decimal(focus.y)}-oh/2))'`
      : `crop=${rect.width}:${rect.height}`;
    return [
      `scale=${size}:force_original_aspect_ratio=increase:force_divisible_by=2`,
      crop,
    ];
  }
  return [
    `scale=${size}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
    `pad=${rect.width}:${rect.height}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`,
  ];
}

function opacityFilters(scene: CompiledScene, durationFrames: number): string[] {
  const from = transformValue(scene.from, 'opacity', 1);
  const to = transformValue(scene.to, 'opacity', 1);
  const filters: string[] = [];
  const transitionFrames = Math.min(TRANSITION_FRAMES, Math.max(1, Math.floor(durationFrames / 3)));

  if (from === to && from < 1) {
    filters.push(`colorchannelmixer=aa=${decimal(Math.max(0, from))}`);
  } else if (from === 0 && to > 0) {
    if (to < 1) filters.push(`colorchannelmixer=aa=${decimal(to)}`);
    filters.push(`fade=t=in:start_frame=0:nb_frames=${durationFrames}:alpha=1`);
  } else if (to === 0 && from > 0) {
    if (from < 1) filters.push(`colorchannelmixer=aa=${decimal(from)}`);
    filters.push(`fade=t=out:start_frame=0:nb_frames=${durationFrames}:alpha=1`);
  } else if (from !== 1 || to !== 1) {
    filters.push(`colorchannelmixer=aa=${decimal(Math.max(0, Math.min(1, (from + to) / 2)))}`);
  }

  if (scene.transitionIn === 'fade') {
    filters.push(`fade=t=in:start_frame=0:nb_frames=${transitionFrames}:alpha=1`);
  }
  if (scene.transitionOut === 'fade') {
    filters.push(
      `fade=t=out:start_frame=${Math.max(0, durationFrames - transitionFrames)}:nb_frames=${transitionFrames}:alpha=1`,
    );
  }
  return filters;
}

function slideExpression(
  base: number,
  distance: number,
  transitionIn: Transition | undefined,
  transitionOut: Transition | undefined,
  globalFrame: string,
  startFrame: number,
  durationFrames: number,
  kind: 'horizontal' | 'vertical',
): string {
  const expectedIn = kind === 'horizontal' ? 'slide-left' : 'slide-up';
  const transitionFrames = Math.min(TRANSITION_FRAMES, Math.max(1, Math.floor(durationFrames / 3)));
  const local = `(${globalFrame}-${startFrame})`;
  let expression = `${base}`;
  if (transitionIn === expectedIn) {
    expression += `-${distance}*(1-min(max(${local}/${transitionFrames},0),1))`;
  }
  if (transitionOut === expectedIn) {
    const outStart = durationFrames - transitionFrames;
    expression += `-${distance}*min(max((${local}-${outStart})/${transitionFrames},0),1)`;
  }
  return expression;
}

function slideOffsetAtFrame(
  distance: number,
  transitionIn: Transition | undefined,
  transitionOut: Transition | undefined,
  frame: number,
  durationFrames: number,
  kind: 'horizontal' | 'vertical',
): number {
  const expected = kind === 'horizontal' ? 'slide-left' : 'slide-up';
  const transitionFrames = Math.min(TRANSITION_FRAMES, Math.max(1, Math.floor(durationFrames / 3)));
  let offset = 0;
  if (transitionIn === expected) offset -= distance * (1 - clamp(frame / transitionFrames, 0, 1));
  if (transitionOut === expected) {
    offset -= distance * clamp((frame - (durationFrames - transitionFrames)) / transitionFrames, 0, 1);
  }
  return offset;
}

function wrapText(value: string, maximumCharacters: number): string {
  const words = value.trim().split(/\s+/u);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const characters = Array.from(word);
    if (characters.length > maximumCharacters) {
      if (line.length > 0) {
        lines.push(line);
        line = '';
      }
      while (characters.length > maximumCharacters) {
        lines.push(characters.splice(0, maximumCharacters).join(''));
      }
      line = characters.join('');
    } else if (
      line.length > 0 &&
      Array.from(line).length + characters.length + 1 > maximumCharacters
    ) {
      lines.push(line);
      line = word;
    } else {
      line = line.length === 0 ? word : `${line} ${word}`;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines.join('\n');
}

function lineSpacing(fontSize: number): number {
  return Math.max(4, Math.round(fontSize * 0.25));
}

function wrapTextToWidth(value: string, fontSize: number, maximumWidth: number): string {
  const averageGlyphWidth = fontSize * 0.62;
  return wrapText(value, Math.max(1, Math.floor(maximumWidth / averageGlyphWidth)));
}

function textBlockHeight(value: string, fontSize: number): number {
  const lineCount = value.split('\n').length;
  const baselineStep = Math.ceil(fontSize * 1.3) + lineSpacing(fontSize);
  return fontSize + Math.max(0, lineCount - 1) * baselineStep;
}

export function buildFfmpegComposition(options: CompositionOptions): FfmpegComposition {
  const {compiled, output, assets, textDirectory, cursorPath, cursorSize: sourceCursorSize, fontPath} = options;
  const width = output.width;
  const height = output.height;
  const fps = output.fps;
  const sourceFps = compiled.canvas.fps;
  const expectedFrames = frameAtOutput(compiled.canvas.durationFrames, sourceFps, fps);
  const durationSeconds = expectedFrames / fps;
  const inputArgs = [
    '-f',
    'lavfi',
    '-i',
    `color=c=${color(compiled.brand.background, 'brand.background')}:s=${width}x${height}:r=${fps}:d=${durationSeconds}`,
  ];
  const filters: string[] = [
    `[0:v]fps=${fps},trim=end_frame=${expectedFrames},setpts=N/(${fps}*TB),format=rgba[base]`,
  ];
  const textFiles: TextFileSpec[] = [];
  const features: CompositionFeatures = {
    screenshotTransform: false,
    crop: false,
    deviceFrame: false,
    cursor: false,
    clickRipple: false,
    callout: false,
    caption: false,
    transition: false,
  };
  const font = filterPath(fontPath);
  const foreground = color(compiled.brand.foreground, 'brand.foreground');
  const accent = color(compiled.brand.accent, 'brand.accent');
  let current = 'base';
  let inputIndex = 1;
  let labelIndex = 0;
  let textIndex = 0;

  const addTextFile = (prefix: string, contents: string): string => {
    const path = join(textDirectory, `${String(textIndex++).padStart(3, '0')}-${prefix}.txt`);
    textFiles.push({path, contents});
    return filterPath(path);
  };

  const drawText = (spec: {
    name: string;
    text: string;
    color: string;
    size: number;
    x: string | number;
    y: string | number;
    start: number;
    end: number;
    alpha?: string;
  }): void => {
    const outputLabel = `text${labelIndex++}`;
    const textPath = addTextFile(spec.name, spec.text);
    const alpha = spec.alpha ? `:alpha='${spec.alpha}'` : '';
    filters.push(
      `[${current}]drawtext=fontfile='${font}':textfile='${textPath}':reload=0:` +
        `fontcolor=${spec.color}:fontsize=${spec.size}:line_spacing=${lineSpacing(spec.size)}:` +
        `x=${spec.x}:y=${spec.y}${alpha}:enable='between(n,${spec.start},${spec.end})'[${outputLabel}]`,
    );
    current = outputLabel;
  };

  const drawDeviceFrame = (rect: ContentRect, start: number, end: number): void => {
    const border = Math.max(6, Math.round(Math.min(width, height) * 0.012));
    const outputLabel = `device${labelIndex++}`;
    filters.push(
      `[${current}]drawbox=x=${rect.x - border}:y=${rect.y - border}:w=${rect.width + border * 2}:` +
        `h=${rect.height + border * 2}:color=0x11151B:t=fill:enable='between(n,${start},${end})'[${outputLabel}]`,
    );
    current = outputLabel;
    features.deviceFrame = true;
  };

  const addVisual = (
    scene: CompiledScene,
    assetId: string,
    rect: ContentRect,
    responsivePortraitFocus = false,
  ): VisualFitTransform => {
    const asset = assets.get(assetId);
    if (!asset) throw new Error(`Scene ${scene.id} references missing asset ${assetId}.`);
    inputArgs.push(...assetInputArgs(asset, fps));
    const sceneStart = frameAtOutput(scene.startFrame, sourceFps, fps);
    const sceneEnd = Math.min(expectedFrames, frameAtOutput(scene.endFrame, sourceFps, fps));
    const sceneDuration = Math.max(1, sceneEnd - sceneStart);
    const easing = scene.easing ?? 'linear';
    const fromScale = transformValue(scene.from, 'scale', 1);
    const toScale = transformValue(scene.to, 'scale', 1);
    const scale = interpolateExpression(fromScale, toScale, 'n', sceneDuration, easing);
    const transitionScale = transitionScaleExpression(
      scene.transitionIn,
      scene.transitionOut,
      'n',
      sceneDuration,
    );
    const scaleExpression = `(${scale})*(${transitionScale})`;
    const xFrom = transformValue(scene.from, 'x', 0) * (width / compiled.canvas.width);
    const xTo = transformValue(scene.to, 'x', 0) * (width / compiled.canvas.width);
    const yFrom = transformValue(scene.from, 'y', 0) * (height / compiled.canvas.height);
    const yTo = transformValue(scene.to, 'y', 0) * (height / compiled.canvas.height);
    const panX = interpolateExpression(xFrom, xTo, 'n', sceneDuration, easing);
    const panY = interpolateExpression(yFrom, yTo, 'n', sceneDuration, easing);
    const sourceLabel = `source${labelIndex++}`;
    const scaledLabel = `scaled${labelIndex++}`;
    const canvasLabel = `viewportCanvas${labelIndex++}`;
    const viewportLabel = `viewport${labelIndex++}`;
    const alphaLabel = `alpha${labelIndex++}`;
    const shiftedLabel = `shifted${labelIndex++}`;
    const visualLabel = `visual${labelIndex++}`;
    const requestedFit = scene.fit ?? 'contain';
    const fit = responsivePortraitFocus && requestedFit === 'contain' ? 'cover' : requestedFit;
    const sourceWidth = asset.width ?? compiled.canvas.width;
    const sourceHeight = asset.height ?? compiled.canvas.height;
    const focusPoints = [
      ...(scene.cursor ? [scene.cursor.from, scene.cursor.to] : []),
      ...(scene.callouts ?? []).map((callout) => callout.at),
    ];
    const focus = responsivePortraitFocus ? visualFocusPoint(focusPoints, sourceWidth, sourceHeight) : undefined;
    const fitTransform = visualFitTransform(sourceWidth, sourceHeight, rect, fit, focus);

    filters.push(
      `[${inputIndex}:v]fps=${fps},trim=end_frame=${sceneDuration},setpts=N/(${fps}*TB),format=rgba,` +
        `${fitFilters(rect, fit, focus).join(',')},setsar=1[${sourceLabel}]`,
    );
    filters.push(
      `[${sourceLabel}]scale=w='max(2,trunc(${rect.width}*${scaleExpression}/2)*2)':` +
        `h='max(2,trunc(${rect.height}*${scaleExpression}/2)*2)':eval=frame[${scaledLabel}]`,
    );
    filters.push(
      `color=c=black@0.0:s=${rect.width}x${rect.height}:r=${fps}:d=${sceneDuration},format=rgba[${canvasLabel}]`,
    );
    filters.push(
      `[${canvasLabel}][${scaledLabel}]overlay=x='(main_w-overlay_w)/2+${panX}':` +
        `y='(main_h-overlay_h)/2+${panY}':shortest=1:format=auto[${viewportLabel}]`,
    );
    const alphaChain = opacityFilters(scene, sceneDuration);
    filters.push(
      `[${viewportLabel}]${alphaChain.length > 0 ? `${alphaChain.join(',')},` : ''}format=rgba[${alphaLabel}]`,
    );
    filters.push(`[${alphaLabel}]setpts=PTS+${sceneStart}/${fps}/TB[${shiftedLabel}]`);
    const x = slideExpression(
      rect.x,
      width,
      scene.transitionIn,
      scene.transitionOut,
      'n',
      sceneStart,
      sceneDuration,
      'horizontal',
    );
    const y = slideExpression(
      rect.y,
      height,
      scene.transitionIn,
      scene.transitionOut,
      'n',
      sceneStart,
      sceneDuration,
      'vertical',
    );
    filters.push(
      `[${current}][${shiftedLabel}]overlay=x='${x}':y='${y}':eof_action=pass:repeatlast=0:` +
        `enable='between(n,${sceneStart},${sceneEnd - 1})'[${visualLabel}]`,
    );
    current = visualLabel;
    inputIndex += 1;
    features.screenshotTransform = true;
    features.crop ||= fit === 'cover';
    features.transition ||= scene.transitionIn !== undefined && scene.transitionIn !== 'none';
    features.transition ||= scene.transitionOut !== undefined && scene.transitionOut !== 'none';
    return fitTransform;
  };

  for (const scene of compiled.scenes) {
    const sceneStart = frameAtOutput(scene.startFrame, sourceFps, fps);
    const sceneEnd = Math.min(expectedFrames, frameAtOutput(scene.endFrame, sourceFps, fps));
    if (sceneStart >= expectedFrames || sceneEnd <= sceneStart) continue;
    let sceneVisualTransform: VisualFitTransform | undefined;

    if (scene.kind === 'screen' && scene.assetId) {
      const asset = assets.get(scene.assetId);
      if (!asset) throw new Error(`Scene ${scene.id} references missing asset ${scene.assetId}.`);
      const sourceAspectRatio = (asset.width ?? compiled.canvas.width) / (asset.height ?? compiled.canvas.height);
      const hasFocusPoints = scene.cursor !== undefined || (scene.callouts?.length ?? 0) > 0;
      const responsivePortraitFocus = height > width && sourceAspectRatio > 1 && hasFocusPoints;
      const rect = screenRect(width, height, sourceAspectRatio, responsivePortraitFocus);
      drawDeviceFrame(rect, sceneStart, sceneEnd - 1);
      sceneVisualTransform = addVisual(scene, scene.assetId, rect, responsivePortraitFocus);
    } else if (scene.kind === 'comparison' && scene.assetId && scene.secondaryAssetId) {
      const rects = comparisonRects(width, height);
      drawDeviceFrame(rects[0], sceneStart, sceneEnd - 1);
      drawDeviceFrame(rects[1], sceneStart, sceneEnd - 1);
      addVisual(scene, scene.assetId, rects[0]);
      addVisual(scene, scene.secondaryAssetId, rects[1]);
    } else if (scene.assetId) {
      sceneVisualTransform = addVisual(scene, scene.assetId, {x: 0, y: 0, width, height});
    }

    const sceneDuration = sceneEnd - sceneStart;
    const sceneEasing: Easing = scene.easing ?? 'linear';
    const localFrame = `(n-${sceneStart})`;
    const overlayTransform = sceneVisualTransform ?? visualFitTransform(
      compiled.canvas.width,
      compiled.canvas.height,
      {x: 0, y: 0, width, height},
      'fill',
    );
    const fromScale = transformValue(scene.from, 'scale', 1);
    const toScale = transformValue(scene.to, 'scale', 1);
    const sceneScale = interpolateExpression(fromScale, toScale, localFrame, sceneDuration, sceneEasing);
    const transitionScale = transitionScaleExpression(
      scene.transitionIn,
      scene.transitionOut,
      localFrame,
      sceneDuration,
    );
    const combinedScale = `(${sceneScale})*(${transitionScale})`;
    const xFrom = transformValue(scene.from, 'x', 0) * (width / compiled.canvas.width);
    const xTo = transformValue(scene.to, 'x', 0) * (width / compiled.canvas.width);
    const yFrom = transformValue(scene.from, 'y', 0) * (height / compiled.canvas.height);
    const yTo = transformValue(scene.to, 'y', 0) * (height / compiled.canvas.height);
    const panX = interpolateExpression(xFrom, xTo, localFrame, sceneDuration, sceneEasing);
    const panY = interpolateExpression(yFrom, yTo, localFrame, sceneDuration, sceneEasing);
    const visualBaseX = slideExpression(
      overlayTransform.rect.x,
      width,
      scene.transitionIn,
      scene.transitionOut,
      'n',
      sceneStart,
      sceneDuration,
      'horizontal',
    );
    const visualBaseY = slideExpression(
      overlayTransform.rect.y,
      height,
      scene.transitionIn,
      scene.transitionOut,
      'n',
      sceneStart,
      sceneDuration,
      'vertical',
    );
    const mapOverlayPoint = (sourceX: string | number, sourceY: string | number): {x: string; y: string} => {
      const localX = `${decimal(overlayTransform.offsetX)}+(${sourceX})*${decimal(overlayTransform.scaleX)}`;
      const localY = `${decimal(overlayTransform.offsetY)}+(${sourceY})*${decimal(overlayTransform.scaleY)}`;
      return {
        x: `(${visualBaseX})+${decimal(overlayTransform.rect.width / 2)}+(${panX})+` +
          `((${localX})-${decimal(overlayTransform.rect.width / 2)})*(${combinedScale})`,
        y: `(${visualBaseY})+${decimal(overlayTransform.rect.height / 2)}+(${panY})+` +
          `((${localY})-${decimal(overlayTransform.rect.height / 2)})*(${combinedScale})`,
      };
    };

    const titleLayout = scene.kind === 'title' || scene.kind === 'outro'
      ? titleTextLayout(width, height, scene.heading ?? '', scene.body)
      : undefined;
    const horizontalSafeMargin = Math.max(24, Math.round(width * 0.08));
    const verticalSafeMargin = Math.max(24, Math.round(height * 0.04));
    const textMaximumWidth = width - horizontalSafeMargin * 2;
    const headingSize = titleLayout?.heading.fontSize ?? Math.max(
      24,
      Math.round(Math.min(height * 0.055, width * 0.055)),
    );
    const bodySize = titleLayout?.body?.fontSize ?? Math.max(
      18,
      Math.round(Math.min(height * 0.04, width * 0.045)),
    );
    const wrappedHeading = scene.heading
      ? (titleLayout?.heading.text ?? wrapTextToWidth(scene.heading, headingSize, textMaximumWidth))
      : undefined;
    const centeredHeadingY = titleLayout?.headingY ?? Math.round(height * 0.045);
    if (scene.heading) {
      drawText({
        name: `${scene.id}-heading`,
        text: wrappedHeading!,
        color: foreground,
        size: headingSize,
        x: '(w-text_w)/2',
        y: centeredHeadingY,
        start: sceneStart,
        end: sceneEnd - 1,
      });
    }
    if (scene.body) {
      const captioned = scene.kind === 'screen' || scene.kind === 'comparison';
      const captionWidth = Math.round(width * 0.84);
      const bodyMaximumWidth = captioned ? captionWidth - horizontalSafeMargin : textMaximumWidth;
      const wrappedBody = titleLayout?.body?.text ?? wrapTextToWidth(scene.body, bodySize, bodyMaximumWidth);
      const bodyBlockHeight = textBlockHeight(wrappedBody, bodySize);
      let bodyY = titleLayout?.bodyY ?? Math.round(height * 0.52);
      if (scene.kind === 'screen' || scene.kind === 'comparison') {
        const boxLabel = `captionBox${labelIndex++}`;
        const captionPadding = Math.max(12, Math.round(bodySize * 0.6));
        const captionHeight = Math.max(Math.round(height * 0.13), bodyBlockHeight + captionPadding * 2);
        const captionX = Math.round(width * 0.08);
        const captionY = Math.min(
          Math.round(height * 0.82),
          height - verticalSafeMargin - captionHeight,
        );
        filters.push(
          `[${current}]drawbox=x=${captionX}:y=${captionY}:w=${captionWidth}:h=${captionHeight}:color=black@0.72:t=fill:` +
            `enable='between(n,${sceneStart},${sceneEnd - 1})'[${boxLabel}]`,
        );
        current = boxLabel;
        features.caption = true;
        bodyY = captionY + Math.round((captionHeight - bodyBlockHeight) / 2);
      } else if (wrappedHeading && !titleLayout) {
        const headingBottom = centeredHeadingY + textBlockHeight(wrappedHeading, headingSize);
        bodyY = Math.max(bodyY, headingBottom + Math.max(24, Math.round(bodySize * 0.65)));
      }
      drawText({
        name: `${scene.id}-body`,
        text: wrappedBody,
        color: captioned ? 'white' : foreground,
        size: bodySize,
        x: '(w-text_w)/2',
        y: bodyY,
        start: sceneStart,
        end: sceneEnd - 1,
      });
    }

    for (const callout of scene.callouts ?? []) {
      const calloutStart = sceneStart + frameAtOutput(callout.startFrame, sourceFps, fps);
      const calloutEnd = Math.min(
        sceneEnd - 1,
        sceneStart + frameAtOutput(callout.startFrame + callout.durationFrames, sourceFps, fps) - 1,
      );
      const position = mapOverlayPoint(callout.at.x, callout.at.y);
      const calloutSize = Math.max(16, Math.round(Math.min(width, height) * 0.032));
      const calloutPaddingX = 14;
      const calloutPaddingY = 8;
      const maximumBoxWidth = Math.round(width * 0.48);
      const wrapped = wrapTextToWidth(
        callout.text,
        calloutSize,
        maximumBoxWidth - calloutPaddingX * 2,
      );
      const longestLine = Math.max(...wrapped.split('\n').map((line) => Array.from(line).length));
      const boxWidth = Math.min(
        maximumBoxWidth,
        Math.round(longestLine * calloutSize * 0.62 + calloutPaddingX * 2),
      );
      const boxHeight = textBlockHeight(wrapped, calloutSize) + calloutPaddingY * 2;
      const calloutSafeMargin = Math.max(12, Math.round(Math.min(width, height) * 0.025));
      const x = `max(${calloutSafeMargin},min(${width - calloutSafeMargin - boxWidth},${position.x}))`;
      const y = `max(${calloutSafeMargin},min(${height - calloutSafeMargin - boxHeight},${position.y}))`;
      const calloutColor = callout.accent ? color(callout.accent, `callout ${callout.text}`) : accent;
      const boxSource = `calloutSource${labelIndex++}`;
      const boxLabel = `calloutBox${labelIndex++}`;
      filters.push(
        `color=c=${calloutColor}@0.92:s=${boxWidth}x${boxHeight}:r=${fps}:` +
          `d=${decimal((calloutEnd - calloutStart + 1) / fps)},format=rgba,` +
          `setpts=PTS+${calloutStart}/${fps}/TB[${boxSource}]`,
      );
      filters.push(
        `[${current}][${boxSource}]overlay=x='${x}':y='${y}':eof_action=pass:repeatlast=0:` +
          `enable='between(n,${calloutStart},${calloutEnd})'[${boxLabel}]`,
      );
      current = boxLabel;
      drawText({
        name: `${scene.id}-callout`,
        text: wrapped,
        color: 'white',
        size: calloutSize,
        x: `'(${x})+${calloutPaddingX}'`,
        y: `'(${y})+${calloutPaddingY}'`,
        start: calloutStart,
        end: calloutEnd,
      });
      features.callout = true;
    }

    if (scene.cursor) {
      inputArgs.push(
        '-f',
        'rawvideo',
        '-pixel_format',
        'rgba',
        '-video_size',
        `${sourceCursorSize}x${sourceCursorSize}`,
        '-framerate',
        String(fps),
        '-i',
        cursorPath,
      );
      const cursorSource = `cursorSource${labelIndex++}`;
      const cursorShifted = `cursorShifted${labelIndex++}`;
      const cursorOutput = `cursorOutput${labelIndex++}`;
      const sourceX = interpolateExpression(
        scene.cursor.from.x,
        scene.cursor.to.x,
        localFrame,
        sceneDuration,
        sceneEasing,
      );
      const sourceY = interpolateExpression(
        scene.cursor.from.y,
        scene.cursor.to.y,
        localFrame,
        sceneDuration,
        sceneEasing,
      );
      const position = mapOverlayPoint(sourceX, sourceY);
      const cursorSize = Math.max(28, Math.round(Math.min(width, height) * 0.075));
      const hotspotX = cursorSize * (CURSOR_RGBA_HOTSPOT.x / sourceCursorSize);
      const hotspotY = cursorSize * (CURSOR_RGBA_HOTSPOT.y / sourceCursorSize);
      filters.push(
        `[${inputIndex}:v]loop=loop=-1:size=1:start=0,fps=${fps},trim=end_frame=${sceneDuration},` +
          `scale=${cursorSize}:${cursorSize},format=rgba[${cursorSource}]`,
      );
      filters.push(`[${cursorSource}]setpts=PTS+${sceneStart}/${fps}/TB[${cursorShifted}]`);
      filters.push(
        `[${current}][${cursorShifted}]overlay=x='(${position.x})-${decimal(hotspotX)}':` +
          `y='(${position.y})-${decimal(hotspotY)}':eof_action=pass:repeatlast=0:` +
          `enable='between(n,${sceneStart},${sceneEnd - 1})'[${cursorOutput}]`,
      );
      current = cursorOutput;
      inputIndex += 1;
      features.cursor = true;

      for (const clickFrame of scene.cursor.clickFrames ?? []) {
        const outputLocalClick = frameAtOutput(clickFrame, sourceFps, fps);
        const click = sceneStart + outputLocalClick;
        const sourcePoint = {
          x: interpolateFrame(
            scene.cursor.from.x,
            scene.cursor.to.x,
            outputLocalClick,
            sceneDuration,
            sceneEasing,
          ),
          y: interpolateFrame(
            scene.cursor.from.y,
            scene.cursor.to.y,
            outputLocalClick,
            sceneDuration,
            sceneEasing,
          ),
        };
        const visualScale = interpolateFrame(fromScale, toScale, outputLocalClick, sceneDuration, sceneEasing) *
          transitionScaleAtFrame(scene.transitionIn, scene.transitionOut, outputLocalClick, sceneDuration);
        const mappedClick = mapPointThroughVisual(sourcePoint, overlayTransform, visualScale, {
          x: interpolateFrame(xFrom, xTo, outputLocalClick, sceneDuration, sceneEasing),
          y: interpolateFrame(yFrom, yTo, outputLocalClick, sceneDuration, sceneEasing),
        });
        const clickX = mappedClick.x + slideOffsetAtFrame(
          width,
          scene.transitionIn,
          scene.transitionOut,
          outputLocalClick,
          sceneDuration,
          'horizontal',
        );
        const clickY = mappedClick.y + slideOffsetAtFrame(
          height,
          scene.transitionIn,
          scene.transitionOut,
          outputLocalClick,
          sceneDuration,
          'vertical',
        );
        const rippleEnd = Math.min(sceneEnd - 1, click + Math.max(5, Math.round(fps * 0.42)));
        const rippleLabel = `ripple${labelIndex++}`;
        const rippleText = addTextFile('click-ripple', 'O');
        filters.push(
          `[${current}]drawtext=fontfile='${font}':textfile='${rippleText}':reload=0:fontcolor=${accent}:` +
            `fontsize='${Math.max(22, Math.round(cursorSize * 0.9))}+2.2*(n-${click})':` +
            `x=${decimal(clickX)}-text_w/2:y=${decimal(clickY)}-text_h/2:` +
            `alpha='max(0,1-(n-${click})/${Math.max(1, rippleEnd - click)})':` +
            `enable='between(n,${click},${rippleEnd})'[${rippleLabel}]`,
        );
        current = rippleLabel;
        features.clickRipple = true;
      }
    }
  }

  const audioLabels: string[] = [];
  for (const [audioNumber, track] of compiled.audio.entries()) {
    const asset = assets.get(track.assetId);
    if (!asset) throw new Error(`Audio track ${track.id} references missing asset ${track.assetId}.`);
    if (asset.type !== 'audio') throw new Error(`Audio track ${track.id} references non-audio asset ${asset.id}.`);
    inputArgs.push('-i', asset.absolutePath);
    const start = frameAtOutput(track.startFrame, sourceFps, fps);
    if (start >= expectedFrames) throw new Error(`Audio track ${track.id} starts after the render ends.`);
    const label = `audio${audioNumber}`;
    const chain = [
      `[${inputIndex}:a]aresample=48000`,
      `atrim=duration=${decimal(durationSeconds - start / fps)}`,
      'asetpts=PTS-STARTPTS',
      `volume=${decimal(track.volume)}`,
    ];
    appendAudioFades(chain, track, durationSeconds - start / fps, sourceFps);
    chain.push(`asetpts=PTS+${start}/${fps}/TB[${label}]`);
    filters.push(chain.join(','));
    audioLabels.push(`[${label}]`);
    inputIndex += 1;
  }

  const finalVideo = 'videoFormatted';
  filters.push(`[${current}]trim=end_frame=${expectedFrames},format=yuv420p[${finalVideo}]`);
  filters.push(`[${finalVideo}]null[vout]`);
  if (audioLabels.length > 0) {
    filters.push(
      `${audioLabels.join('')}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0,` +
        `atrim=duration=${decimal(durationSeconds)},asetpts=N/SR/TB[aout]`,
    );
  }

  return {
    inputArgs,
    filterGraph: `${filters.join(';\n')}\n`,
    videoLabel: '[vout]',
    ...(audioLabels.length > 0 ? {audioLabel: '[aout]' as const} : {}),
    textFiles,
    expectedFrames,
    durationSeconds,
    features,
  };
}

function appendAudioFades(
  chain: string[],
  track: AudioTrackSpec,
  availableSeconds: number,
  sourceFps: number,
): void {
  if (track.fadeInFrames && track.fadeInFrames > 0) {
    const seconds = track.fadeInFrames / sourceFps;
    chain.push(`afade=t=in:st=0:d=${decimal(seconds)}`);
  }
  if (track.fadeOutFrames && track.fadeOutFrames > 0) {
    const seconds = track.fadeOutFrames / sourceFps;
    const start = Math.max(0, availableSeconds - seconds);
    chain.push(`afade=t=out:st=${decimal(start)}:d=${decimal(seconds)}`);
  }
}
