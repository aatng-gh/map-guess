import { getContext, setContext } from 'svelte';
import type { MapState } from '$lib/game/mapState.svelte';

const MAP_CONTEXT_KEY = Symbol('map-state');

export function setMapContext(mapState: MapState) {
  setContext(MAP_CONTEXT_KEY, mapState);
}

export function getMapContext() {
  return getContext<MapState>(MAP_CONTEXT_KEY);
}
