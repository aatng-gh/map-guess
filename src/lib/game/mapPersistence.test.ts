import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COUNTRIES } from '$lib/data/countries';
import {
  clearSavedState,
  CURRENT_SAVE_VERSION,
  loadSavedState,
  migrateSavedState,
  saveSavedState,
  STORAGE_KEY,
} from '$lib/game/mapPersistence';

const firstCountry = COUNTRIES[0];

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

describe('map persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  it('migrates legacy saved state without an explicit version', () => {
    expect(
      migrateSavedState({
        revealed: [firstCountry.id, 'not-a-country'],
        mode: 'unknown',
        bestQuizScore: Number.NaN,
      }),
    ).toEqual({
      version: CURRENT_SAVE_VERSION,
      revealed: [firstCountry.id],
      mode: 'explore',
      bestQuizScore: 0,
    });
  });

  it('migrates current version saved state', () => {
    expect(
      migrateSavedState({
        version: 1,
        revealed: [firstCountry.id],
        mode: 'quiz',
        bestQuizScore: 4,
      }),
    ).toEqual({
      version: CURRENT_SAVE_VERSION,
      revealed: [firstCountry.id],
      mode: 'quiz',
      bestQuizScore: 4,
    });
  });

  it('rejects unsupported saved state versions', () => {
    expect(
      migrateSavedState({
        version: 999,
        revealed: [firstCountry.id],
        mode: 'quiz',
        bestQuizScore: 4,
      }),
    ).toBeNull();
  });

  it('normalizes invalid saved state while loading', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify({
        revealed: [firstCountry.id, 'not-a-country'],
        mode: 'unknown',
        bestQuizScore: 4,
      }),
    );

    expect(loadSavedState()).toEqual({
      version: CURRENT_SAVE_VERSION,
      revealed: [firstCountry.id],
      mode: 'explore',
      bestQuizScore: 4,
    });
  });

  it('returns null when saved JSON cannot be parsed', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('{nope');

    expect(loadSavedState()).toBeNull();
  });

  it('saves only stable persisted state', () => {
    saveSavedState({
      revealed: [firstCountry.id, 'not-a-country' as typeof firstCountry.id],
      mode: 'quiz',
      bestQuizScore: 8,
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({
        version: CURRENT_SAVE_VERSION,
        revealed: [firstCountry.id],
        mode: 'quiz',
        bestQuizScore: 8,
      }),
    );
  });

  it('clears saved state through the adapter', () => {
    clearSavedState();

    expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
});
