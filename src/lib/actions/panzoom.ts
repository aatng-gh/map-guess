/**
 * Svelte action for pan/zoom gestures.
 *
 * Drag/pan works on both ocean and land (per latest request).
 * Uses DRAG_THRESHOLD (20px) to distinguish tap (small movement) vs drag.
 * - Movement < threshold on up: treat as tap, revert micro-pan, trigger reveal if country under pointer.
 * - Movement > threshold: treat as drag, pan the view, suppress reveal, apply dragging cursor/state.
 * Pinch/zoom with 2+ fingers available anywhere.
 *
 * The action focuses purely on view manipulation (pan, pinch, wheel, dblclick).
 * Uses world-anchored pan, micro-pan revert on !wasDrag for clean taps (no view shift from jitter).
 *
 * Usage:
 *   <svg use:panzoom>
 *
 * The action mutates a bound view object for reactivity outside the hot loop.
 */

import type { Action } from 'svelte/action';
import {
  applyPinchPan,
  applyPinchZoom,
  createGestureState,
  getPinchFrame,
  hasCrossedDragThreshold,
  panToPointer,
  resetMicroPan,
  toDragStart,
  zoomAt,
  type Point,
  type View,
} from '$lib/gestures/mapGestures';

interface PanZoomParams {
  // onTap is called from the action's explicit !wasDrag path in pointerup (using
  // elementFromPoint) to ensure taps on countries work reliably despite the custom
  // pointer capture and ancestor listeners (which can interfere with native clicks).
  onTap?: (cid: string) => void;
  // Optional external view object to keep in sync (preferred for runes)
  view?: View;
}

function getSVGPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  return pt.matrixTransform(ctm.inverse());
}

function applyTransform(
  content: SVGGElement,
  tx: number,
  ty: number,
  scale: number,
) {
  // Direct DOM keeps high-frequency gesture updates out of Svelte's render loop.
  content.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`);
}

export const panzoom: Action<SVGSVGElement, PanZoomParams | undefined> = (
  node,
  params = {},
) => {
  const content = node.querySelector<SVGGElement>('#map-content');
  if (!content) {
    console.warn('[panzoom] #map-content not found');
    return {};
  }

  const gesture = createGestureState();
  let currentView: View = params.view || { tx: 0, ty: 0, scale: 1 };

  function syncView() {
    if (params.view) {
      // Mutate external for runes reactivity (caller sees update)
      params.view.tx = currentView.tx;
      params.view.ty = currentView.ty;
      params.view.scale = currentView.scale;
    }
  }

  function updateTransform() {
    applyTransform(content!, currentView.tx, currentView.ty, currentView.scale);
    syncView();
  }

  function setCurrentView(nextView: View) {
    currentView = nextView;
    updateTransform();
  }

  function setDragging(isDragging: boolean) {
    node.classList.toggle('dragging', isDragging);
    document.body.classList.toggle('is-dragging-map', isDragging);

    if (isDragging) {
      node.dataset.dragging = 'true';
    } else {
      delete node.dataset.dragging;
    }
  }

  function getWorldPoint(client: Point) {
    return getSVGPoint(node, client.x, client.y);
  }

  function revealTargetAt(client: Point) {
    const target = document.elementFromPoint(client.x, client.y);
    if (!target || !node.contains(target)) return;

    const el = target.closest('[data-cid]');
    const cid = el?.getAttribute('data-cid');
    if (cid) params.onTap?.(cid);
  }

  function onPointerDown(e: PointerEvent) {
    try {
      node.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail if the pointer was already released.
    }
    const client = { x: e.clientX, y: e.clientY };
    gesture.pointers.set(e.pointerId, client);

    if (gesture.pointers.size === 1) {
      gesture.dragStart = toDragStart(
        currentView,
        getWorldPoint(client),
        client,
      );
      gesture.hasDragged = false;
    }
    if (gesture.pointers.size >= 2) {
      setDragging(true);
    }
    gesture.prevPinch = null;
  }

  function onPointerMove(e: PointerEvent) {
    if (!gesture.pointers.has(e.pointerId)) return;
    const client = { x: e.clientX, y: e.clientY };
    gesture.pointers.set(e.pointerId, client);

    if (gesture.pointers.size === 1 && gesture.dragStart) {
      if (
        !gesture.hasDragged &&
        hasCrossedDragThreshold(gesture.dragStart, client)
      ) {
        gesture.hasDragged = true;
        setDragging(true);
      }

      setCurrentView(
        panToPointer(currentView, gesture.dragStart, getWorldPoint(client)),
      );
    } else if (gesture.pointers.size === 2) {
      const nextPinch = getPinchFrame(gesture.pointers.values());
      if (!nextPinch) return;

      if (!gesture.prevPinch) {
        gesture.prevPinch = nextPinch;
        return;
      }

      const centerWorld = getWorldPoint({ x: nextPinch.cx, y: nextPinch.cy });
      const zoomedView = applyPinchZoom(
        currentView,
        gesture.prevPinch,
        nextPinch,
        centerWorld,
      );
      setCurrentView(applyPinchPan(zoomedView, gesture.prevPinch, nextPinch));
      gesture.prevPinch = nextPinch;
    }
  }

  function onPointerUp(e: PointerEvent) {
    const client = { x: e.clientX, y: e.clientY };
    gesture.pointers.delete(e.pointerId);
    gesture.prevPinch = null;

    if (gesture.pointers.size === 0) {
      const wasDrag = gesture.hasDragged;

      if (gesture.dragStart) {
        if (!wasDrag) {
          setCurrentView(resetMicroPan(currentView, gesture.dragStart));
        }
        gesture.dragStart = null;
      }

      gesture.hasDragged = false;
      setDragging(false);

      if (wasDrag) {
        setTimeout(() => {
          delete node.dataset.dragging;
        }, 300);
      } else {
        // Explicit tap reveal using elementFromPoint + closest data-cid.
        // This is the reliable path (original vanilla approach) because custom
        // pointer capture + ancestor listeners + DOM mutations during up can
        // interfere with or suppress native synthesized 'click' events on child SVG elements.
        revealTargetAt(client);
      }
    } else if (gesture.pointers.size === 1) {
      const [remainingPointer] = gesture.pointers.values();
      gesture.dragStart = toDragStart(
        currentView,
        getWorldPoint(remainingPointer),
        remainingPointer,
      );
      gesture.hasDragged = false;
      setDragging(false);
    }
  }

  // Attach (passive where safe)
  node.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });

  // Wheel zoom (around point)
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const pt = getSVGPoint(node, e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.18 : 0.86;
    setCurrentView(zoomAt(currentView, pt, factor));
  };
  node.addEventListener('wheel', onWheel, { passive: false });

  // Double-tap / dblclick zoom in
  const onDbl = (e: MouseEvent) => {
    e.preventDefault();
    const pt = getSVGPoint(node, e.clientX, e.clientY);
    setCurrentView(zoomAt(currentView, pt, 1.55));
  };
  node.addEventListener('dblclick', onDbl);

  // Initial
  updateTransform();

  return {
    update(newParams: PanZoomParams | undefined) {
      params = newParams || {};
      if (params.view) {
        currentView = { ...params.view };
        updateTransform();
      }
    },
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('dblclick', onDbl);
      setDragging(false);
    },
  };
};
