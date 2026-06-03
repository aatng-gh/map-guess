<script lang="ts">
  import { fitMapToScreen, zoomMap } from '$lib/game/mapCommands';
</script>

<div
  id="zoom-rail"
  class="zoom-controls absolute right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 pointer-events-auto"
  role="group"
  aria-label="Map zoom controls"
>
  <button
    type="button"
    class="glass-fab zoom-control zoom-control-in w-12 h-12 text-[color:var(--text-on-glass)] active:text-white"
    aria-label="Zoom in"
    aria-controls="world-map"
    onclick={() => zoomMap(1.28)}
  >
    <svg class="zoom-control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  </button>

  <button
    type="button"
    class="glass-fab zoom-control zoom-control-fit w-12 h-12 text-[color:var(--accent)] active:text-[color:var(--accent-emphasis)]"
    aria-label="Fit map to screen"
    aria-controls="world-map"
    onclick={fitMapToScreen}
  >
    <svg class="zoom-control-icon zoom-control-icon-fit" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4" />
    </svg>
  </button>

  <button
    type="button"
    class="glass-fab zoom-control zoom-control-out w-12 h-12 text-[color:var(--text-on-glass)] active:text-white"
    aria-label="Zoom out"
    aria-controls="world-map"
    onclick={() => zoomMap(0.78)}
  >
    <svg class="zoom-control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  </button>
</div>

<style>
  #zoom-rail {
    right: calc(0.75rem + env(safe-area-inset-right));
  }

  .zoom-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .zoom-control-fit {
    color: var(--accent);
  }

  .zoom-control-icon {
    width: 1.4rem;
    height: 1.4rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2.25;
  }

  .zoom-control-icon-fit {
    width: 1.3rem;
    height: 1.3rem;
    stroke-width: 2.15;
  }
</style>
