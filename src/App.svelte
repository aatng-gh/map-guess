<script lang="ts">
  // Svelte 5 runes + context for Map Guess
  import Map from '$lib/components/Map.svelte';
  import GamePanel from '$lib/components/GamePanel.svelte';
  import ZoomRail from '$lib/components/ZoomRail.svelte';
  import { setMapContext } from '$lib/context/mapContext';
  import { commandForShortcut, runMapCommand } from '$lib/game/mapCommands';
  import { MapState } from '$lib/game/mapState.svelte';
  import { shouldIgnoreMapShortcut } from '$lib/gestures/mapGestures';

  const mapState = new MapState();
  setMapContext(mapState);

  // Expose for easy auditing / chrome mcp evaluate_script / tests
  if (typeof window !== 'undefined') {
    (window as any).__MAP_TEST_API = {
      getRevealedCount: () => mapState.revealed.size,
      getRevealed: () => Array.from(mapState.revealed),
      resetAll: () => mapState.resetAll(),
      revealCountry: (cid: string) => mapState.reveal(cid),
      getView: () => ({ ...mapState.view }),
      getMode: () => mapState.mode,
      getTargetName: () => mapState.targetName,
      canUndo: () => mapState.canUndo,
      undo: () => mapState.undoLastAction(),
    };
  }

  // Keyboard (global, Svelte way — reworked from old document listener)
  function handleKeydown(e: KeyboardEvent) {
    if (shouldIgnoreMapShortcut(e.target)) return;

    const command = commandForShortcut(e.key);
    if (!command) return;

    e.preventDefault();
    runMapCommand(mapState, command);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  id="map-viewport"
  class="absolute inset-0 overflow-hidden touch-none bg-[#0b1120]"
>
  <!-- Declarative map (Phase 2 foundation) -->
  <Map bind:view={mapState.view} />

  <!-- Liquid Glass floating panel -->
  <GamePanel />

  <!-- Zoom rail -->
  <ZoomRail />

  <!-- Gesture hint -->
  <div
    id="map-hint"
    class="glass glass-hint pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs px-4 py-1.5 rounded-2xl tracking-[0.5px]"
  >
    Drag • Pinch/scroll to zoom • Tap to reveal
  </div>
</div>

<style>
  :global(body) {
    background: var(--viewport-bg);
  }

  @media (max-width: 900px) {
    #map-hint {
      display: none;
    }
  }
</style>
