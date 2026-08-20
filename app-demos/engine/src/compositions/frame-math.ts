import type {Easing, Transform, Transition} from '../contracts/types.js';

export const TRANSITION_FRAMES = 8;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
export function easeAt(progress: number, easing: Easing): number {
  const p = clamp(progress, 0, 1);
  switch (easing) {
    case 'ease-in':
      return p * p;
    case 'ease-out':
      return 1 - (1 - p) * (1 - p);
    case 'ease-in-out':
      return p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;
    case 'spring':
      return clamp(1 - Math.exp(-6 * p) * Math.cos(10 * p), 0, 1.08);
    default:
      return p;
  }
}

export function interpolateFrame(
  from: number,
  to: number,
  frame: number,
  durationFrames: number,
  easing: Easing,
): number {
  const denominator = Math.max(1, durationFrames - 1);
  return from + (to - from) * easeAt(frame / denominator, easing);
}

function progressExpression(frameVariable: string, durationFrames: number): string {
  return `min(max(${frameVariable}/${Math.max(1, durationFrames - 1)},0),1)`;
}

export function easingExpression(
  frameVariable: string,
  durationFrames: number,
  easing: Easing,
): string {
  const p = progressExpression(frameVariable, durationFrames);
  switch (easing) {
    case 'ease-in':
      return `pow(${p},2)`;
    case 'ease-out':
      return `(1-pow(1-${p},2))`;
    case 'ease-in-out':
      return `if(lt(${p},0.5),2*pow(${p},2),1-pow(-2*${p}+2,2)/2)`;
    case 'spring':
      return `min(max(1-exp(-6*${p})*cos(10*${p}),0),1.08)`;
    default:
      return p;
  }
}

export function interpolateExpression(
  from: number,
  to: number,
  frameVariable: string,
  durationFrames: number,
  easing: Easing,
): string {
  const progress = easingExpression(frameVariable, durationFrames, easing);
  return `(${from}+(${to - from})*${progress})`;
}

export function transformValue(transform: Transform | undefined, key: keyof Transform, fallback: number): number {
  return transform?.[key] ?? fallback;
}

export function transitionScaleExpression(
  transitionIn: Transition | undefined,
  transitionOut: Transition | undefined,
  frameVariable: string,
  durationFrames: number,
): string {
  const transitionFrames = Math.min(TRANSITION_FRAMES, Math.max(1, Math.floor(durationFrames / 3)));
  const factors: string[] = [];
  if (transitionIn === 'scale') {
    factors.push(`(0.92+0.08*min(max(${frameVariable}/${transitionFrames},0),1))`);
  }
  if (transitionOut === 'scale') {
    const start = durationFrames - transitionFrames;
    factors.push(`(1-0.08*min(max((${frameVariable}-${start})/${transitionFrames},0),1))`);
  }
  return factors.length === 0 ? '1' : factors.join('*');
}

export function transitionScaleAtFrame(
  transitionIn: Transition | undefined,
  transitionOut: Transition | undefined,
  frame: number,
  durationFrames: number,
): number {
  const transitionFrames = Math.min(TRANSITION_FRAMES, Math.max(1, Math.floor(durationFrames / 3)));
  let scale = 1;
  if (transitionIn === 'scale') {
    scale *= 0.92 + 0.08 * clamp(frame / transitionFrames, 0, 1);
  }
  if (transitionOut === 'scale') {
    const start = durationFrames - transitionFrames;
    scale *= 1 - 0.08 * clamp((frame - start) / transitionFrames, 0, 1);
  }
  return scale;
}
