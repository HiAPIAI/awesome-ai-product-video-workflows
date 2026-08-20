const CURSOR_SIZE = 48;
const CURSOR_POLYGON: ReadonlyArray<readonly [number, number]> = [
  [5, 3],
  [5, 37],
  [14, 29],
  [21, 44],
  [28, 40],
  [21, 26],
  [34, 26],
];

function pointInPolygon(x: number, y: number): boolean {
  let inside = false;
  for (let index = 0, previous = CURSOR_POLYGON.length - 1; index < CURSOR_POLYGON.length; previous = index++) {
    const currentPoint = CURSOR_POLYGON[index];
    const previousPoint = CURSOR_POLYGON[previous];
    if (!currentPoint || !previousPoint) continue;
    const [currentX, currentY] = currentPoint;
    const [previousX, previousY] = previousPoint;
    const intersects =
      currentY > y !== previousY > y &&
      x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function createCursorRgba(): Uint8Array {
  const pixels = new Uint8Array(CURSOR_SIZE * CURSOR_SIZE * 4);
  for (let y = 0; y < CURSOR_SIZE; y += 1) {
    for (let x = 0; x < CURSOR_SIZE; x += 1) {
      if (!pointInPolygon(x + 0.5, y + 0.5)) continue;
      let outline = false;
      for (let offsetY = -2; offsetY <= 2 && !outline; offsetY += 1) {
        for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
          if (!pointInPolygon(x + offsetX + 0.5, y + offsetY + 0.5)) {
            outline = true;
            break;
          }
        }
      }
      const pixel = (y * CURSOR_SIZE + x) * 4;
      const value = outline ? 17 : 255;
      pixels[pixel] = value;
      pixels[pixel + 1] = value;
      pixels[pixel + 2] = value;
      pixels[pixel + 3] = 255;
    }
  }
  return pixels;
}

export const CURSOR_RGBA_SIZE = CURSOR_SIZE;
export const CURSOR_RGBA_HOTSPOT = {x: 5, y: 3} as const;
