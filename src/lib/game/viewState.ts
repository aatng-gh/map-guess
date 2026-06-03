import type { View } from '$lib/gestures/mapGestures';

export const DEFAULT_VIEW: View = { tx: 0, ty: 0, scale: 1 };

export function createDefaultView(): View {
  return { ...DEFAULT_VIEW };
}

export function requestFitView() {
  if (typeof window === 'undefined') return;

  window.requestAnimationFrame(() => {
    window.dispatchEvent(new window.CustomEvent('map:fit-view'));
  });
}
