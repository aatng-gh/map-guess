import type { MapState } from '$lib/game/mapState.svelte';

export function zoomMap(factor: number) {
  window.dispatchEvent(
    new window.CustomEvent('map:zoom-view', { detail: { factor } }),
  );
}

export function fitMapToScreen() {
  window.dispatchEvent(new window.CustomEvent('map:fit-view'));
}

export function runMapCommand(mapState: MapState, command: string) {
  switch (command) {
    case 'game.revealRandom':
      mapState.revealRandom();
      return true;
    case 'game.new':
      mapState.newGame();
      return true;
    case 'game.undo':
      mapState.undoLastAction();
      return true;
    case 'game.clearSavedProgress':
      mapState.clearSavedProgress();
      return true;
    case 'view.zoomIn':
      zoomMap(1.28);
      return true;
    case 'view.zoomOut':
      zoomMap(0.78);
      return true;
    case 'view.fit':
      fitMapToScreen();
      return true;
    default:
      return false;
  }
}

export function commandForShortcut(key: string) {
  const normalized = key.toLowerCase();

  if (normalized === 'r') return 'game.revealRandom';
  if (normalized === 'u') return 'game.undo';
  if (key === 'Escape') return 'game.new';
  if (key === '+' || key === '=') return 'view.zoomIn';
  if (key === '-' || key === '_') return 'view.zoomOut';
  if (normalized === 'f') return 'view.fit';

  return null;
}
