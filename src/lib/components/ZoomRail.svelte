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
    class="glass-fab zoom-control zoom-control-in w-11 h-11 text-3xl leading-none text-[color:var(--text-on-glass)] active:text-white focus:outline-none"
    aria-label="Zoom in"
    aria-controls="world-map"
    onclick={() => zoomMap(1.28)}
  >
    <span aria-hidden="true">+</span>
  </button>

  <button
    type="button"
    class="glass-fab zoom-control zoom-control-fit w-11 h-11 text-[10px] font-bold tracking-[1.5px] text-[color:var(--accent)] active:text-[color:var(--accent-emphasis)] focus:outline-none"
    aria-label="Fit map to screen"
    aria-controls="world-map"
    onclick={fitMapToScreen}
  >
    Fit
  </button>

  <button
    type="button"
    class="glass-fab zoom-control zoom-control-out w-11 h-11 text-3xl leading-none text-[color:var(--text-on-glass)] active:text-white focus:outline-none"
    aria-label="Zoom out"
    aria-controls="world-map"
    onclick={() => zoomMap(0.78)}
  >
    <span aria-hidden="true">−</span>
  </button>
</div>

<style>
  #zoom-rail {
    right: calc(0.75rem + env(safe-area-inset-right));
  }
</style>
