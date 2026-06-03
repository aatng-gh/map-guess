import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COUNTRIES } from '$lib/data/countries';
import { MapState } from './mapState.svelte';

const firstCountry = COUNTRIES[0];
const secondCountry = COUNTRIES[1];

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

describe('MapState', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', createLocalStorageMock());
    vi.stubGlobal('window', {
      CustomEvent,
      dispatchEvent: vi.fn(),
      requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    });
  });

  it('starts in explore mode with empty progress', () => {
    const state = new MapState();

    expect(state.mode).toBe('explore');
    expect(state.target).toBeNull();
    expect(state.count).toBe(0);
    expect(state.completionPct).toBe(0);
    expect(state.accuracy).toBe(100);
    expect(state.lastMessage).toBe('Ready');
  });

  it('reveals valid countries once and persists progress', () => {
    const state = new MapState();

    expect(state.revealCountry(firstCountry.id)).toBe(true);
    expect(state.revealed.has(firstCountry.id)).toBe(true);
    expect(state.count).toBe(1);
    expect(state.lastMessage).toBe(`Revealed ${firstCountry.name}`);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'map-g:mvp-state',
      expect.stringContaining(firstCountry.id),
    );

    expect(state.revealCountry(firstCountry.id)).toBe(false);
    expect(state.count).toBe(1);
    expect(state.lastMessage).toBe(`${firstCountry.name} already revealed`);
  });

  it('undoes the most recent explore reveal', () => {
    const state = new MapState();

    state.revealCountry(firstCountry.id);
    state.revealCountry(secondCountry.id);

    expect(state.canUndo).toBe(true);
    expect(state.count).toBe(2);

    expect(state.undoLastAction()).toBe(true);
    expect(state.revealed).toEqual(new Set([firstCountry.id]));
    expect(state.count).toBe(1);
    expect(state.lastMessage).toBe('Undid last reveal');

    expect(state.undoLastAction()).toBe(true);
    expect(state.revealed.size).toBe(0);
    expect(state.canUndo).toBe(false);
  });

  it('loads only valid saved progress', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify({
        revealed: [firstCountry.id, 'not-a-country'],
        mode: 'quiz',
        bestQuizScore: 7,
      }),
    );

    const state = new MapState();

    expect(state.revealed).toEqual(new Set([firstCountry.id]));
    expect(state.mode).toBe('quiz');
    expect(state.bestQuizScore).toBe(7);
    expect(state.target).not.toBe(firstCountry.id);
  });

  it('scores quiz answers and resets streak on misses', () => {
    const state = new MapState();
    state.setMode('quiz');
    state.target = firstCountry.id;

    state.answer(secondCountry.id);
    expect(state.correct).toBe(0);
    expect(state.misses).toBe(1);
    expect(state.streak).toBe(0);
    expect(state.revealed.size).toBe(0);
    expect(state.lastMessage).toBe(
      `${secondCountry.name} is not ${firstCountry.name}`,
    );

    state.answer(firstCountry.id);
    expect(state.correct).toBe(1);
    expect(state.misses).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.bestStreak).toBe(1);
    expect(state.revealed.has(firstCountry.id)).toBe(true);
    expect(state.accuracy).toBe(50);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('undoes a correct quiz reveal with score and target restored', () => {
    const state = new MapState();
    state.setMode('quiz');
    state.target = firstCountry.id;

    state.answer(firstCountry.id);

    expect(state.correct).toBe(1);
    expect(state.revealed.has(firstCountry.id)).toBe(true);
    expect(state.target).not.toBe(firstCountry.id);

    expect(state.undoLastAction()).toBe(true);
    expect(state.correct).toBe(0);
    expect(state.misses).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.revealed.size).toBe(0);
    expect(state.target).toBe(firstCountry.id);
  });

  it('clears saved progress and starts a fresh game', () => {
    const state = new MapState();
    state.bestQuizScore = 5;
    state.revealCountry(firstCountry.id);

    state.clearSavedProgress();

    expect(localStorage.removeItem).toHaveBeenCalledWith('map-g:mvp-state');
    expect(state.bestQuizScore).toBe(0);
    expect(state.revealed.size).toBe(0);
    expect(state.view).toEqual({ tx: 0, ty: 0, scale: 1 });
    expect(state.lastMessage).toBe('Saved progress cleared');
  });
});
