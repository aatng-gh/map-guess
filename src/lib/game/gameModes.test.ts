import { describe, expect, it, vi } from 'vitest';

import { COUNTRIES, type CountryId } from '$lib/data/countries';
import {
  controllerForMode,
  exploreMode,
  quizMode,
  type GameModeRuntime,
} from '$lib/game/gameModes';

const firstCountry = COUNTRIES[0];
const secondCountry = COUNTRIES[1];

function createRuntime(overrides: Partial<GameModeRuntime> = {}): GameModeRuntime {
  const completedAt: number | null = null;
  let correct = 0;
  let streak = 0;
  let target: CountryId | null = firstCountry.id;
  let revealed = new Set<CountryId>();

  return {
    getCompletedAt: () => completedAt,
    getCorrect: () => correct,
    getAccuracy: () => 75,
    getElapsedSeconds: () => 12,
    incrementCorrect: () => {
      correct += 1;
    },
    incrementMisses: () => {
      return;
    },
    getStreak: () => streak,
    setStreak: (nextStreak) => {
      streak = nextStreak;
    },
    setBestStreak: (nextBestStreak) => {
      return nextBestStreak;
    },
    getTarget: () => target,
    setTarget: (nextTarget) => {
      target = nextTarget;
    },
    getTargetName: () => (target ? firstCountry.name : null),
    revealCountry: vi.fn((cid) => {
      revealed = new Set([...revealed, cid]);
      return true;
    }),
    recordUndoCheckpoint: vi.fn(),
    setRevealed: (nextRevealed) => {
      revealed = nextRevealed;
    },
    finishIfComplete: vi.fn(),
    persist: vi.fn(),
    setLastMessage: vi.fn(),
    setIncorrectPick: vi.fn(),
    nextTarget: vi.fn(() => secondCountry.id),
    getRevealed: () => revealed,
    setBestQuizScore: (score) => {
      return score;
    },
    ...overrides,
  };
}

describe('game mode controllers', () => {
  it('resolves controllers by mode', () => {
    expect(controllerForMode('explore')).toBe(exploreMode);
    expect(controllerForMode('quiz')).toBe(quizMode);
  });

  it('keeps explore mode lifecycle targetless', () => {
    const runtime = createRuntime();

    expect(exploreMode.canRevealRandom).toBe(true);
    expect(exploreMode.initialTarget(new Set())).toBeNull();
    expect(exploreMode.statusMessage).toBe('Explore mode');
    expect(exploreMode.newGameMessage).toBe('New explore session');
    expect(exploreMode.complete(runtime)).toBe('Complete in 12s');
    expect(exploreMode.summary(runtime)).toEqual({
      title: 'Round complete',
      detail: 'Completed in 12s',
    });
  });

  it('centralizes quiz lifecycle copy and completion scoring', () => {
    const runtime = createRuntime({
      getCorrect: () => 8,
      setBestQuizScore: vi.fn(),
    });

    expect(quizMode.canRevealRandom).toBe(false);
    expect(quizMode.initialTarget(new Set([firstCountry.id]))).not.toBe(
      firstCountry.id,
    );
    expect(quizMode.statusMessage).toBe('Find the highlighted target country');
    expect(quizMode.newGameMessage).toBe('New quiz started');
    expect(quizMode.complete(runtime)).toBe(
      'Complete: 75% accuracy in 12s',
    );
    expect(runtime.setBestQuizScore).toHaveBeenCalledWith(8);
    expect(quizMode.summary(runtime)).toEqual({
      title: 'Round complete',
      detail: '75% accuracy in 12s',
    });
  });
});
