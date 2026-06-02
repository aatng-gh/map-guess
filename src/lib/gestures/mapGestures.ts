export type View = { tx: number; ty: number; scale: number };
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type ViewportSize = { width: number; height: number };

export const MIN_SCALE = 0.35;
export const MAX_SCALE = 22;
export const DRAG_THRESHOLD = 20;

export interface GestureConfig {
  dragThreshold?: number;
  minScale?: number;
  maxScale?: number;
}

export interface DragStart {
  tx: number;
  ty: number;
  worldX: number;
  worldY: number;
  clientX: number;
  clientY: number;
}

export interface PinchFrame {
  dist: number;
  cx: number;
  cy: number;
}

export interface GestureState {
  pointers: Map<number, Point>;
  dragStart: DragStart | null;
  hasDragged: boolean;
  prevPinch: PinchFrame | null;
}

export function createGestureState(): GestureState {
  return {
    pointers: new Map(),
    dragStart: null,
    hasDragged: false,
    prevPinch: null,
  };
}

export function clampScale(scale: number, config: GestureConfig = {}) {
  return Math.max(
    config.minScale ?? MIN_SCALE,
    Math.min(config.maxScale ?? MAX_SCALE, scale),
  );
}

export function toDragStart(
  view: View,
  world: Point,
  client: Point,
): DragStart {
  return {
    tx: view.tx,
    ty: view.ty,
    worldX: world.x,
    worldY: world.y,
    clientX: client.x,
    clientY: client.y,
  };
}

export function hasCrossedDragThreshold(
  start: DragStart,
  client: Point,
  config: GestureConfig = {},
) {
  return (
    Math.hypot(client.x - start.clientX, client.y - start.clientY) >
    (config.dragThreshold ?? DRAG_THRESHOLD)
  );
}

export function panToPointer(view: View, start: DragStart, world: Point): View {
  return {
    ...view,
    tx: start.tx + (world.x - start.worldX),
    ty: start.ty + (world.y - start.worldY),
  };
}

export function zoomAt(
  view: View,
  point: Point,
  factor: number,
  config: GestureConfig = {},
): View {
  const nextScale = clampScale(view.scale * factor, config);
  return scaleAt(view, point, nextScale);
}

export function scaleAt(view: View, point: Point, nextScale: number): View {
  const oldScale = view.scale;
  if (oldScale === 0 || nextScale === oldScale)
    return { ...view, scale: nextScale };

  const ratio = nextScale / oldScale;
  return {
    tx: point.x - (point.x - view.tx) * ratio,
    ty: point.y - (point.y - view.ty) * ratio,
    scale: nextScale,
  };
}

export function getPinchFrame(points: Iterable<Point>): PinchFrame | null {
  const [p0, p1] = Array.from(points);
  if (!p0 || !p1) return null;

  return {
    dist: Math.hypot(p1.x - p0.x, p1.y - p0.y),
    cx: (p0.x + p1.x) / 2,
    cy: (p0.y + p1.y) / 2,
  };
}

export function applyPinchZoom(
  view: View,
  previous: PinchFrame,
  next: PinchFrame,
  centerWorld: Point,
  config: GestureConfig = {},
) {
  if (previous.dist <= 0) return view;

  const ratio = next.dist / previous.dist;
  if (ratio <= 0.0001) return view;

  return scaleAt(view, centerWorld, clampScale(view.scale * ratio, config));
}

export function applyPinchPan(
  view: View,
  previous: PinchFrame,
  next: PinchFrame,
): View {
  const dcx = next.cx - previous.cx;
  const dcy = next.cy - previous.cy;
  if (Math.abs(dcx) <= 0.5 && Math.abs(dcy) <= 0.5) return view;

  return {
    ...view,
    tx: view.tx + dcx / view.scale,
    ty: view.ty + dcy / view.scale,
  };
}

export function resetMicroPan(view: View, start: DragStart): View {
  return {
    ...view,
    tx: start.tx,
    ty: start.ty,
  };
}

export function fitViewToViewport(
  bounds: Rect,
  viewBox: Rect,
  viewport: ViewportSize,
  paddingPx = 24,
  config: GestureConfig = {},
): View {
  const usableViewport = {
    width: Math.max(1, viewport.width),
    height: Math.max(1, viewport.height),
  };

  const paddingX = Math.min(
    viewBox.width * 0.12,
    (paddingPx / usableViewport.width) * viewBox.width,
  );
  const paddingY = Math.min(
    viewBox.height * 0.12,
    (paddingPx / usableViewport.height) * viewBox.height,
  );

  const targetWidth = Math.max(1, viewBox.width - paddingX * 2);
  const targetHeight = Math.max(1, viewBox.height - paddingY * 2);
  const scale = clampScale(
    Math.min(targetWidth / bounds.width, targetHeight / bounds.height),
    config,
  );

  const targetCenter = {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };
  const boundsCenter = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  return {
    tx: targetCenter.x - boundsCenter.x * scale,
    ty: targetCenter.y - boundsCenter.y * scale,
    scale,
  };
}

export function shouldIgnoreMapShortcut(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  if (target.closest('[contenteditable="true"]')) return true;

  const interactiveTarget = target.closest(
    'input, textarea, select, button, [role="textbox"], [role="dialog"], dialog',
  );

  return Boolean(interactiveTarget);
}
