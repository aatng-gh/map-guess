<script lang="ts">
  // Svelte 5 runes + context for Map Guess
  import Map from '$lib/components/Map.svelte';
  import GamePanel from '$lib/components/GamePanel.svelte';
  import ZoomRail from '$lib/components/ZoomRail.svelte';
  import { ALL_IDS } from '$lib/data/countries';

  type CountryId = string;

  // Core reactive state (runes) — reworking from old imperative state
  // Use a class wrapper for reliable context reactivity (addresses Svelte 5 state capture warning)
  class MapState {
    revealed = $state(new Set<CountryId>());
    view = $state({ tx: 0, ty: 0, scale: 1 });

    reveal(cid: CountryId) {
      this.revealed = new Set([...this.revealed, cid]);
    }

    resetAll() {
      this.revealed = new Set();
      this.view = { tx: 0, ty: 0, scale: 1 };
    }

    revealRandom() {
      const unrevealed = Array.from(ALL_IDS).filter((id) => !this.revealed.has(id));
      if (unrevealed.length === 0) return;
      const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this.reveal(pick);
    }
  }

  const mapState = new MapState();

  // Context API (consumed by Map, Panel, Rail) — class instance is reactive
  import { setContext } from 'svelte';
  setContext('map', mapState);

  // Expose for easy auditing / chrome mcp evaluate_script / tests
  if (typeof window !== 'undefined') {
    (window as any).__MAP_TEST_API = {
      getRevealedCount: () => mapState.revealed.size,
      getRevealed: () => Array.from(mapState.revealed),
      resetAll: () => mapState.resetAll(),
      revealCountry: (cid: string) => mapState.reveal(cid as any),
      getView: () => ({ ...mapState.view }),
    };
  }

  // Keyboard (global, Svelte way — reworked from old document listener)
  function handleKeydown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === 'r') {
      mapState.revealRandom();
    } else if (e.key === 'Escape') {
      mapState.resetAll();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div id="map-viewport" class="absolute inset-0 overflow-hidden touch-none bg-[#0b1120]">
  <!-- Declarative map (Phase 2 foundation) -->
  <Map bind:view={mapState.view} />

  <!-- Liquid Glass floating panel -->
  <GamePanel />

  <!-- Zoom rail -->
  <ZoomRail />

  <!-- Gesture hint -->
  <div
    id="map-hint"
    class="map-hint-panel-aware glass pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs px-4 py-1.5 rounded-2xl tracking-[0.5px]"
  >
    Drag • Pinch/scroll to zoom • Tap to reveal
  </div>
</div>

<style>
  :global(body) {
    background: var(--viewport-bg);
  }

  @media (max-width: 640px) {
    #map-hint.map-hint-panel-aware {
      bottom: calc(12px + 8.5rem + env(safe-area-inset-bottom));
      max-width: calc(100% - 24px);
      text-align: center;
      white-space: normal;
    }
  }
</style>
