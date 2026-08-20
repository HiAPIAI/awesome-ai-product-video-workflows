export interface ContentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface VisualFitTransform {
  rect: ContentRect;
  sourceWidth: number;
  sourceHeight: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export interface TextBlockLayout {
  text: string;
  fontSize: number;
  lineSpacing: number;
  lineHeight: number;
  lineCount: number;
  height: number;
  maximumLineWidth: number;
}

export interface TitleTextLayout {
  safeWidth: number;
  safeTop: number;
  safeBottom: number;
  headingY: number;
  bodyY?: number;
  heading: TextBlockLayout;
  body?: TextBlockLayout;
}

function even(value: number): number {
  return Math.max(2, Math.floor(value / 2) * 2);
}

function nearestEven(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

function bounded(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function visualFocusPoint(
  points: readonly LayoutPoint[],
  sourceWidth: number,
  sourceHeight: number,
): LayoutPoint {
  if (points.length === 0) return {x: 0.5, y: 0.5};
  const x = points.reduce((sum, point) => sum + point.x, 0) / points.length / sourceWidth;
  const y = points.reduce((sum, point) => sum + point.y, 0) / points.length / sourceHeight;
  return {x: bounded(x, 0, 1), y: bounded(y, 0, 1)};
}

export function visualFitTransform(
  sourceWidth: number,
  sourceHeight: number,
  rect: ContentRect,
  fit: 'contain' | 'cover' | 'fill',
  focus: LayoutPoint = {x: 0.5, y: 0.5},
): VisualFitTransform {
  if (sourceWidth <= 0 || sourceHeight <= 0) throw new Error('Visual source dimensions must be positive.');
  if (fit === 'fill') {
    return {
      rect,
      sourceWidth,
      sourceHeight,
      scaleX: rect.width / sourceWidth,
      scaleY: rect.height / sourceHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const scale = fit === 'cover'
    ? Math.max(rect.width / sourceWidth, rect.height / sourceHeight)
    : Math.min(rect.width / sourceWidth, rect.height / sourceHeight);
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const offsetX = fit === 'cover'
    ? -bounded(scaledWidth * focus.x - rect.width / 2, 0, Math.max(0, scaledWidth - rect.width))
    : (rect.width - scaledWidth) / 2;
  const offsetY = fit === 'cover'
    ? -bounded(scaledHeight * focus.y - rect.height / 2, 0, Math.max(0, scaledHeight - rect.height))
    : (rect.height - scaledHeight) / 2;
  return {
    rect,
    sourceWidth,
    sourceHeight,
    scaleX: scale,
    scaleY: scale,
    offsetX,
    offsetY,
  };
}

export function mapPointThroughVisual(
  point: LayoutPoint,
  transform: VisualFitTransform,
  visualScale = 1,
  pan: LayoutPoint = {x: 0, y: 0},
): LayoutPoint {
  const localX = point.x * transform.scaleX + transform.offsetX;
  const localY = point.y * transform.scaleY + transform.offsetY;
  return {
    x: transform.rect.x + transform.rect.width / 2 +
      (localX - transform.rect.width / 2) * visualScale + pan.x,
    y: transform.rect.y + transform.rect.height / 2 +
      (localY - transform.rect.height / 2) * visualScale + pan.y,
  };
}

function characterWidth(character: string): number {
  if (/\s/u.test(character)) return 0.34;
  if (/[MW@%&]/u.test(character)) return 0.9;
  if (/[A-Z]/u.test(character)) return 0.68;
  if (/[ilI1.,:;'!|]/u.test(character)) return 0.3;
  if (/[^\u0000-\u00ff]/u.test(character)) return 1;
  return 0.56;
}

function estimatedTextWidth(value: string, fontSize: number): number {
  return [...value].reduce((width, character) => width + characterWidth(character) * fontSize, 0);
}

function splitWord(word: string, fontSize: number, availableWidth: number): string[] {
  const pieces: string[] = [];
  let piece = '';
  for (const character of word) {
    if (piece.length > 0 && estimatedTextWidth(`${piece}${character}`, fontSize) > availableWidth) {
      pieces.push(piece);
      piece = character;
    } else {
      piece += character;
    }
  }
  if (piece.length > 0) pieces.push(piece);
  return pieces;
}

function wrapTextToWidth(value: string, fontSize: number, availableWidth: number): string[] {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length === 0) return [''];
  const words = normalized.split(' ').flatMap((word) => splitWord(word, fontSize, availableWidth));
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line.length === 0 ? word : `${line} ${word}`;
    if (line.length > 0 && estimatedTextWidth(candidate, fontSize) > availableWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

export function layoutTextBlock(value: string, fontSize: number, availableWidth: number): TextBlockLayout {
  const lines = wrapTextToWidth(value, fontSize, availableWidth);
  const lineSpacing = Math.max(4, Math.round(fontSize * 0.25));
  const lineHeight = Math.ceil(fontSize * 1.3) + lineSpacing;
  return {
    text: lines.join('\n'),
    fontSize,
    lineSpacing,
    lineHeight,
    lineCount: lines.length,
    height: fontSize + lineHeight * Math.max(0, lines.length - 1),
    maximumLineWidth: Math.max(...lines.map((line) => estimatedTextWidth(line, fontSize))),
  };
}

export function titleTextLayout(width: number, height: number, heading: string, body?: string): TitleTextLayout {
  const horizontalMargin = Math.max(20, Math.round(width * 0.08));
  const verticalMargin = Math.max(20, Math.round(height * 0.12));
  const safeWidth = width - horizontalMargin * 2;
  const safeHeight = height - verticalMargin * 2;
  const shortestSide = Math.min(width, height);
  let headingSize = Math.max(24, Math.round(shortestSide * 0.1));
  let bodySize = Math.max(18, Math.round(shortestSide * 0.04));
  let headingLayout = layoutTextBlock(heading, headingSize, safeWidth);
  let bodyLayout = body ? layoutTextBlock(body, bodySize, safeWidth) : undefined;
  let gap = bodyLayout ? Math.max(16, Math.round(headingSize * 0.36)) : 0;

  while (
    headingLayout.height + (bodyLayout ? gap + bodyLayout.height : 0) > safeHeight &&
    (headingSize > 12 || bodySize > 10)
  ) {
    headingSize = Math.max(12, headingSize - 2);
    bodySize = Math.max(10, bodySize - 1);
    headingLayout = layoutTextBlock(heading, headingSize, safeWidth);
    bodyLayout = body ? layoutTextBlock(body, bodySize, safeWidth) : undefined;
    gap = bodyLayout ? Math.max(12, Math.round(headingSize * 0.36)) : 0;
  }

  const totalHeight = headingLayout.height + (bodyLayout ? gap + bodyLayout.height : 0);
  const headingY = Math.max(verticalMargin, Math.round((height - totalHeight) / 2));
  const bodyY = bodyLayout ? headingY + headingLayout.height + gap : undefined;
  return {
    safeWidth,
    safeTop: verticalMargin,
    safeBottom: height - verticalMargin,
    headingY,
    ...(bodyY === undefined ? {} : {bodyY}),
    heading: headingLayout,
    ...(bodyLayout === undefined ? {} : {body: bodyLayout}),
  };
}

export function screenRect(
  width: number,
  height: number,
  sourceAspectRatio = width / height,
  focusedPortrait = true,
): ContentRect {
  const portrait = height > width;
  const contentWidth = even(width * (portrait ? 0.88 : 0.82));
  const portraitLandscapeSource = portrait && sourceAspectRatio > 1;
  const contentHeight = portraitLandscapeSource
    ? (focusedPortrait
      ? even(Math.min(height * 0.72, contentWidth / 0.8))
      : nearestEven(Math.min(height * 0.72, contentWidth / sourceAspectRatio)))
    : even(height * (portrait ? 0.72 : 0.76));
  return {
    x: Math.floor((width - contentWidth) / 2),
    y: Math.floor((height - contentHeight) / 2),
    width: contentWidth,
    height: contentHeight,
  };
}

export function comparisonRects(width: number, height: number): [ContentRect, ContentRect] {
  const portrait = height > width;
  if (portrait) {
    const contentWidth = even(width * 0.82);
    const contentHeight = even(height * 0.34);
    const gap = even(height * 0.045);
    const top = Math.floor((height - contentHeight * 2 - gap) / 2);
    return [
      {x: Math.floor((width - contentWidth) / 2), y: top, width: contentWidth, height: contentHeight},
      {
        x: Math.floor((width - contentWidth) / 2),
        y: top + contentHeight + gap,
        width: contentWidth,
        height: contentHeight,
      },
    ];
  }
  const contentWidth = even(width * 0.4);
  const contentHeight = even(height * 0.66);
  const gap = even(width * 0.045);
  const left = Math.floor((width - contentWidth * 2 - gap) / 2);
  return [
    {x: left, y: Math.floor((height - contentHeight) / 2), width: contentWidth, height: contentHeight},
    {
      x: left + contentWidth + gap,
      y: Math.floor((height - contentHeight) / 2),
      width: contentWidth,
      height: contentHeight,
    },
  ];
}
