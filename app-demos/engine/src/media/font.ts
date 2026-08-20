import {access} from 'node:fs/promises';

const FONT_CANDIDATES = [
  'C:\\Windows\\Fonts\\segoeui.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
];

export async function resolveRenderFont(): Promise<string> {
  for (const candidate of FONT_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next deterministic local font.
    }
  }
  throw new Error('No supported local render font was found. Install Arial, Segoe UI, or DejaVu Sans.');
}
