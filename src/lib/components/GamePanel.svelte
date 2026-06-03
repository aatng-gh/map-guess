<script lang="ts">
  import { getMapContext } from '$lib/context/mapContext';
  import { runMapCommand } from '$lib/game/mapCommands';

  const mapState = getMapContext();

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
        class="panel-title m-0 font-semibold text-2xl tracking-[-0.03em] leading-none"
      >
        Map Guess
      </h1>
      <div
        class="panel-kicker text-[10px] text-[color:var(--accent)] tracking-[1.5px] mt-0.5 uppercase"
      >
        {mapState.mode === 'quiz' ? 'Country Quiz' : 'World Explorer'}
      </div>
    </div>
    <div class="panel-counter text-right leading-none" aria-live="polite">
      <div class="counter-label text-[10px] text-[color:var(--accent)] tracking-widest">
        REVEALED
      </div>
      <div class="counter-value font-semibold tabular-nums text-xl tracking-tighter">
        <span>{count}</span>/<span>{total}</span>
      </div>
    </div>
  </div>

  <div
    class="mode-switch mb-3 grid grid-cols-2 rounded-2xl bg-white/8 p-1 text-xs font-semibold"
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
        {#if mapState.mode === 'quiz'}
          {mapState.accuracy}% accuracy in {mapState.elapsedSeconds}s
        {:else}
          Completed in {mapState.elapsedSeconds}s
        {/if}
      </div>
    </div>
  {/if}

  <div class="sr-only" aria-live="polite">{mapState.lastMessage}</div>

  <div class="action-row grid grid-cols-3 gap-2" role="group" aria-label="Game actions">
    <button
      type="button"
      class="action-button glass-contained-positive action-random touch-target px-2.5 py-2 text-white text-sm font-semibold rounded-2xl"
      aria-label="Reveal a random country"
      disabled={mapState.mode === 'quiz'}
      onclick={() => runMapCommand(mapState, 'game.revealRandom')}
    >
      Random
    </button>
    <button
      type="button"
      class="action-button glass-contained action-undo touch-target px-2.5 py-2 text-white text-sm font-semibold rounded-2xl"
      aria-label="Undo last reveal"
      disabled={!mapState.canUndo}
      onclick={() => runMapCommand(mapState, 'game.undo')}
    >
      Undo
    </button>
    <button
      type="button"
      class="action-button glass-contained-danger action-reset touch-target px-2.5 py-2 text-white text-sm font-semibold rounded-2xl"
      aria-label="Start a new game"
      onclick={() => runMapCommand(mapState, 'game.new')}
    >
      New
    </button>
  </div>

  <details class="danger-disclosure mt-2">
    <summary class="danger-summary" aria-label="Show more actions">
      <span class="danger-chevron" aria-hidden="true"></span>
    </summary>
    <button
      type="button"
      class="clear-button mt-2 w-full rounded-2xl px-3 py-1.5 text-xs font-semibold"
      onclick={() => runMapCommand(mapState, 'game.clearSavedProgress')}
    >
      Clear saved progress
    </button>
  </details>
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

  .stat-label {
    color: var(--text-muted);
  }

  .danger-disclosure {
    color: var(--text-muted);
  }

  .danger-summary {
    width: 100%;
    height: 1.25rem;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: transparent;
    transition:
      color 160ms var(--ease),
      background 160ms var(--ease);
  }

  .danger-summary::-webkit-details-marker {
    display: none;
  }

  .danger-disclosure[open] .danger-summary,
  .danger-summary:hover,
  .danger-summary:focus-visible {
    color: white;
    background: rgb(255 255 255 / 0.1);
  }

  .danger-chevron {
    width: 0.5rem;
    height: 0.5rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translateY(-2px) rotate(45deg);
    transition: transform 160ms var(--ease);
  }

  .danger-disclosure[open] .danger-chevron {
    transform: translateY(2px) rotate(225deg);
  }

  .clear-button {
    color: white;
    background: color-mix(in oklch, var(--danger-solid), black 8%);
    border: 1px solid color-mix(in oklch, var(--danger-solid), white 18%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.16),
      0 6px 12px -8px rgb(0 0 0 / 0.45);
    transition:
      background 160ms var(--ease),
      border-color 160ms var(--ease),
      box-shadow 160ms var(--ease);
  }

  .clear-button:hover,
  .clear-button:focus-visible {
    background: color-mix(in oklch, var(--danger-solid), white 8%);
    border-color: color-mix(in oklch, var(--danger-solid), white 30%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.22),
      0 8px 16px -10px rgb(0 0 0 / 0.52);
  }

  .action-button,
  .clear-button {
    position: relative;
    overflow: hidden;
  }

  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    white-space: nowrap;
    text-align: center;
  }

  .action-button::before,
  .clear-button::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--glass-inner-highlight);
    opacity: 0.38;
    pointer-events: none;
    transition: opacity 160ms var(--ease);
  }

  .action-button:hover::before,
  .action-button:focus-visible::before,
  .clear-button:hover::before,
  .clear-button:focus-visible::before {
    opacity: 0.56;
  }

  .action-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .action-button:disabled::before {
    opacity: 0.18;
  }

  @media (max-width: 900px) {
    #game-panel {
      top: auto;
      right: auto;
      bottom: calc(12px + env(safe-area-inset-bottom));
      left: 50%;
      width: min(22rem, calc(100vw - 24px));
      padding: 0.75rem;
      transform: translateX(-50%);
      font-size: 0.8125rem;
    }

    .panel-title {
      font-size: 1.25rem;
    }

    .panel-kicker,
    .counter-label {
      font-size: 0.5625rem;
      letter-spacing: 1.2px;
    }

    .counter-value {
      font-size: 1rem;
    }

    .mode-switch {
      margin-bottom: 0.5rem;
      border-radius: 14px;
    }

    .mode-button {
      border-radius: 10px;
      padding: 0.3125rem 0.5rem;
    }

    .progress-track {
      margin-bottom: 0.625rem;
    }

    .target-box,
    .summary-box {
      margin-bottom: 0.625rem;
      padding: 0.5rem 0.625rem;
      border-radius: 14px;
    }

    .action-row {
      gap: 0.5rem;
    }

    .action-button {
      min-height: 38px;
      border-radius: 14px;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
    }

    .danger-disclosure {
      margin-top: 0.5rem;
    }

    .clear-button {
      border-radius: 14px;
      padding: 0.375rem 0.75rem;
      font-size: 0.6875rem;
    }

    .danger-summary {
      height: 1.125rem;
    }
  }

  @media (max-width: 380px) {
    #game-panel {
      width: min(20rem, calc(100vw - 20px));
      padding: 0.625rem;
    }

    .panel-title {
      font-size: 1.125rem;
    }

    .action-button {
      min-height: 36px;
      padding-inline: 0.625rem;
    }
  }
</style>
