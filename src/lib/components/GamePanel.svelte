<script lang="ts">
  import { getContext } from 'svelte';
  import type { MapState } from '$lib/game/mapState.svelte';

  const mapState = getContext<MapState>('map');

  const count = $derived(mapState.count);
  const total = $derived(mapState.total);
  const pct = $derived(mapState.completionPct);
  const targetName = $derived(mapState.targetName);
</script>

<section
  id="game-panel"
  class="glass glass-panel absolute top-3 right-3 w-64 sm:w-72 z-50 pointer-events-auto text-sm"
  aria-labelledby="game-panel-title"
>
  <div class="flex items-start justify-between gap-4 mb-2.5">
    <div>
      <h1
        id="game-panel-title"
        class="m-0 font-semibold text-2xl tracking-[-0.03em] leading-none"
      >
        Map Guess
      </h1>
      <div
        class="text-[10px] text-[color:var(--accent)] tracking-[1.5px] mt-0.5 uppercase"
      >
        {mapState.mode === 'quiz' ? 'Country Quiz' : 'World Explorer'}
      </div>
    </div>
    <div class="text-right leading-none" aria-live="polite">
      <div class="text-[10px] text-[color:var(--accent)] tracking-widest">
        REVEALED
      </div>
      <div class="font-semibold tabular-nums text-xl tracking-tighter">
        <span>{count}</span>/<span>{total}</span>
      </div>
    </div>
  </div>

  <div
    class="mb-3 grid grid-cols-2 rounded-2xl bg-white/8 p-1 text-xs font-semibold"
    role="group"
    aria-label="Game mode"
  >
    <button
      type="button"
      class:mode-active={mapState.mode === 'explore'}
      class="mode-button rounded-xl px-2 py-1.5"
      aria-pressed={mapState.mode === 'explore'}
      onclick={() => mapState.setMode('explore')}
    >
      Explore
    </button>
    <button
      type="button"
      class:mode-active={mapState.mode === 'quiz'}
      class="mode-button rounded-xl px-2 py-1.5"
      aria-pressed={mapState.mode === 'quiz'}
      onclick={() => mapState.setMode('quiz')}
    >
      Quiz
    </button>
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

  {#if mapState.mode === 'quiz'}
    <div class="target-box mb-3 rounded-2xl px-3 py-2">
      <div
        class="text-[10px] text-[color:var(--accent)] tracking-widest uppercase"
      >
        Find
      </div>
      <div class="target-name text-base font-semibold leading-tight">
        {targetName ?? 'Complete'}
      </div>
      <div
        class="mt-2 grid grid-cols-4 gap-2 text-center text-[11px] tabular-nums"
      >
        <div>
          <div class="stat-value">{mapState.correct}</div>
          <div class="stat-label">Hit</div>
        </div>
        <div>
          <div class="stat-value">{mapState.misses}</div>
          <div class="stat-label">Miss</div>
        </div>
        <div>
          <div class="stat-value">{mapState.streak}</div>
          <div class="stat-label">Streak</div>
        </div>
        <div>
          <div class="stat-value">{mapState.accuracy}%</div>
          <div class="stat-label">Acc</div>
        </div>
      </div>
    </div>
  {/if}

  {#if mapState.isComplete}
    <div class="summary-box mb-3 rounded-2xl px-3 py-2 text-xs">
      <div class="font-semibold">Round complete</div>
      <div class="mt-1 text-[color:var(--text-muted)]">
        {mapState.accuracy}% accuracy in {mapState.elapsedSeconds}s
      </div>
    </div>
  {/if}

  <div class="sr-only" aria-live="polite">{mapState.lastMessage}</div>

  <div class="action-row flex gap-2" role="group" aria-label="Game actions">
    <button
      class="action-button glass-contained-positive action-random touch-target flex-1 px-3 py-2 text-white text-sm font-semibold rounded-2xl"
      aria-label="Reveal a random country"
      disabled={mapState.mode === 'quiz'}
      onclick={() => mapState.revealRandom && mapState.revealRandom()}
    >
      Random
    </button>
    <button
      class="action-button glass-contained-danger action-reset touch-target flex-1 px-3 py-2 text-white text-sm font-semibold rounded-2xl"
      aria-label="Start a new game"
      onclick={() => mapState.newGame()}
    >
      New
    </button>
  </div>

  <button
    type="button"
    class="clear-button mt-2 w-full rounded-2xl px-3 py-1.5 text-xs font-semibold"
    onclick={() => mapState.clearSavedProgress()}
  >
    Clear saved progress
  </button>
</section>

<style>
  .mode-button {
    color: var(--text-muted);
    transition:
      color 160ms var(--ease),
      background 160ms var(--ease);
  }

  .mode-button.mode-active {
    color: white;
    background: rgb(255 255 255 / 0.16);
  }

  .target-box,
  .summary-box {
    background: rgb(255 255 255 / 0.1);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
  }

  .target-name {
    color: white;
  }

  .stat-value {
    color: white;
    font-weight: 700;
  }

  .stat-label,
  .clear-button {
    color: var(--text-muted);
  }

  .clear-button {
    background: rgb(255 255 255 / 0.06);
  }

  .action-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
</style>
