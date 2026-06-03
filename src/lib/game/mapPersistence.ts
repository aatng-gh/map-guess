import type { CountryId } from '$lib/data/countries';
import type { GameMode, PersistedMapState } from '$lib/game/gameTypes';
import { isCountryId } from '$lib/game/revealState';

export const STORAGE_KEY = 'map-g:mvp-state';
export const CURRENT_SAVE_VERSION = 1;

type RawSavedState = Partial<
  Omit<PersistedMapState, 'revealed'> & {
    revealed: unknown;
    version: unknown;
  }
>;

function normalizeMode(mode: unknown): GameMode {
  return mode === 'quiz' ? 'quiz' : 'explore';
}

function normalizeRevealed(revealed: unknown) {
  return Array.isArray(revealed)
    ? revealed.filter(
        (id): id is CountryId => typeof id === 'string' && isCountryId(id),
      )
    : [];
}

function normalizeBestQuizScore(bestQuizScore: unknown) {
  return typeof bestQuizScore === 'number' && Number.isFinite(bestQuizScore)
    ? bestQuizScore
    : 0;
}

export function migrateSavedState(raw: unknown): PersistedMapState | null {
  if (!raw || typeof raw !== 'object') return null;

  const parsed = raw as RawSavedState;
  const version = parsed.version ?? CURRENT_SAVE_VERSION;
  if (version !== CURRENT_SAVE_VERSION) return null;

  return {
    version: CURRENT_SAVE_VERSION,
    revealed: normalizeRevealed(parsed.revealed),
    mode: normalizeMode(parsed.mode),
    bestQuizScore: normalizeBestQuizScore(parsed.bestQuizScore),
  };
}

export function loadSavedState(): PersistedMapState | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return migrateSavedState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSavedState(payload: Omit<PersistedMapState, 'version'>) {
  if (typeof localStorage === 'undefined') return;

  const persisted: PersistedMapState = {
    version: CURRENT_SAVE_VERSION,
    revealed: payload.revealed.filter(isCountryId),
    mode: payload.mode,
    bestQuizScore: payload.bestQuizScore,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

export function clearSavedState() {
  if (typeof localStorage === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY);
}
