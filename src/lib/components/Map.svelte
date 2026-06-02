<script lang="ts">
  // Declarative Svelte map + reworked gestures (panzoom action)
  import { getContext } from 'svelte';
  import { COUNTRIES } from '$lib/data/countries';
  import { panzoom } from '$lib/actions/panzoom';
  import type { View } from '$lib/gestures/mapGestures';

  interface Props {
    view?: View;
  }

  const mapState = getContext<any>('map') || { revealed: new Set(), reveal: () => {} };

  // View bound to the class state (panzoom action will drive it)
  let { view = $bindable({ tx: 0, ty: 0, scale: 1 }) }: Props = $props();

  const revealed = $derived(mapState.revealed || new Set());
</script>

<svg
  id="world-map"
  class="w-full h-full block select-none"
  viewBox="30.767 241.591 784.077 458.627"
  xmlns="http://www.w3.org/2000/svg"
  role="application"
  aria-label="Interactive world map. Drag to pan, pinch or scroll to zoom, tap countries to reveal."
  use:panzoom={{ view, onTap: (cid) => mapState.reveal(cid) }}
>
  <!--
    Revealing is handled by the panzoom action's tap hit-test so mouse, touch,
    pointer capture, and drag suppression all use the same event path.
  -->
  <g id="map-content" transform="translate({view.tx} {view.ty}) scale({view.scale})">
    {#each COUNTRIES as country (country.id)}
      <g
        id={country.id}
        data-cid={country.id}
        class:revealed={revealed.has(country.id)}
      >
        {#each country.paths as p, i (i)}
          <path
            d={p.d}
            class="land-path"
            class:revealed={revealed.has(country.id)}
          />
        {/each}
      </g>
    {/each}

    <!-- Labels layer (declarative in later phases) -->
    <g id="labels"></g>
  </g>
</svg>

<style>
  .land-path {
    fill: var(--land-unrevealed);
    stroke: var(--land-unrevealed-stroke);
    stroke-width: 0.7;
    transition: fill 180ms var(--ease), stroke 180ms var(--ease);
  }
  .land-path.revealed,
  g.revealed .land-path {
    fill: var(--land-revealed);
    stroke: var(--land-revealed-stroke);
    stroke-width: 1.1;
  }
</style>
