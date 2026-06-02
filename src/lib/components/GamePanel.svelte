<script lang="ts">
  import { getContext } from 'svelte';
  import { TOTAL } from '$lib/data/countries';

  const mapState = getContext<any>('map') || { revealed: new Set(), reset: () => {}, random: () => {} };

  // Reactive count & progress (Svelte 5 runes + context)
  const count = $derived(mapState.revealed ? mapState.revealed.size : 0);
  const total = TOTAL;
  const pct = $derived(total > 0 ? Math.round((count / total) * 100) : 0);
</script>

<section
  id="game-panel"
  class="glass glass-panel absolute top-3 right-3 w-64 sm:w-72 z-50 pointer-events-auto text-sm"
  aria-labelledby="game-panel-title"
>
  <div class="flex items-start justify-between gap-4 mb-2.5">
    <div>
      <h1 id="game-panel-title" class="m-0 font-semibold text-2xl tracking-[-0.03em] leading-none">
        Map Guess
      </h1>
      <div class="text-[10px] text-[color:var(--accent)] tracking-[1.5px] mt-0.5 uppercase">
        World Explorer
      </div>
    </div>
    <div class="text-right leading-none" aria-live="polite">
      <div class="text-[10px] text-[color:var(--accent)] tracking-widest">REVEALED</div>
      <div class="font-semibold tabular-nums text-xl tracking-tighter">
        <span>{count}</span>/<span>{total}</span>
      </div>
    </div>
  </div>

  <!-- Progress -->
  <div
    class="progress-track mb-4 ring-1 ring-inset ring-white/10"
    role="progressbar"
    aria-label="Countries revealed"
    aria-valuemin="0"
    aria-valuemax={total}
    aria-valuenow={count}
  >
    <div class="progress-bar" style="width: {pct}%"></div>
  </div>

  <div class="action-row flex gap-2" role="group" aria-label="Game actions">
    <button
      class="action-button glass-contained-positive action-random touch-target flex-1 px-3 py-2 text-white text-sm font-semibold rounded-2xl"
      aria-label="Reveal a random country"
      onclick={() => mapState.revealRandom && mapState.revealRandom()}
    >
      Random
    </button>
    <button
      class="action-button glass-contained-danger action-reset touch-target flex-1 px-3 py-2 text-white text-sm font-semibold rounded-2xl"
      aria-label="Reset revealed countries and map zoom"
      onclick={() => mapState.resetAll && mapState.resetAll()}
    >
      Reset
    </button>
  </div>
</section>
