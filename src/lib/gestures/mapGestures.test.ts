import { describe, expect, it } from 'vitest';

import {
  applyPinchPan,
  applyPinchZoom,
  clampScale,
  fitViewToViewport,
  getPinchFrame,
  hasCrossedDragThreshold,
  panToPointer,
  scaleAt,
  toDragStart,
} from './mapGestures';

describe('map gesture math', () => {
  it('clamps scale to defaults and custom bounds', () => {
    expect(clampScale(0.1)).toBe(0.35);
    expect(clampScale(30)).toBe(22);
    expect(clampScale(5, { minScale: 2, maxScale: 4 })).toBe(4);
  });

  it('keeps the zoom focal point visually anchored', () => {
    const view = { tx: 10, ty: -20, scale: 2 };
    const focalPoint = { x: 110, y: 80 };

    const next = scaleAt(view, focalPoint, 4);

    expect(next).toEqual({ tx: -90, ty: -120, scale: 4 });
  });

  it('pans from the original drag origin', () => {
    const start = toDragStart(
      { tx: 5, ty: -2, scale: 1 },
      { x: 100, y: 200 },
      { x: 10, y: 20 },
    );

    expect(hasCrossedDragThreshold(start, { x: 25, y: 31 })).toBe(false);
    expect(hasCrossedDragThreshold(start, { x: 31, y: 20 })).toBe(true);
    expect(panToPointer({ tx: 999, ty: 999, scale: 1 }, start, { x: 130, y: 180 })).toEqual({
      tx: 35,
      ty: -22,
      scale: 1,
    });
  });

  it('computes pinch frame, zoom ratio, and scaled pan delta', () => {
    const previous = getPinchFrame([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const next = getPinchFrame([
      { x: 2, y: 4 },
      { x: 22, y: 4 },
    ]);

    expect(previous).toEqual({ dist: 10, cx: 5, cy: 0 });
    expect(next).toEqual({ dist: 20, cx: 12, cy: 4 });

    const zoomed = applyPinchZoom(
      { tx: 0, ty: 0, scale: 3 },
      previous!,
      next!,
      { x: 50, y: 75 },
    );
    expect(zoomed).toEqual({ tx: -50, ty: -75, scale: 6 });

    expect(applyPinchPan(zoomed, previous!, next!)).toEqual({
      tx: -50 + 7 / 6,
      ty: -75 + 4 / 6,
      scale: 6,
    });
  });

  it('fits bounds inside a viewport with padding and centered translation', () => {
    expect(
      fitViewToViewport(
        { x: 100, y: 50, width: 200, height: 100 },
        { x: 0, y: 0, width: 800, height: 400 },
        { width: 800, height: 400 },
        0,
      ),
    ).toEqual({ tx: -400, ty: -200, scale: 4 });
  });
});
