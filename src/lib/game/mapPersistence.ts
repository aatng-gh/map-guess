import type { CountryId } from '$lib/data/countries';
import type { GameMode, PersistedMapState } from '$lib/game/gameTypes';
import { isCountryId } from '$lib/game/revealState';

export const STORAGE_KEY = 'map-g:mvp-state';

export function readSavedState(): PersistedMapState | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedMapState>;
    const mode: GameMode = parsed.mode === 'quiz' ? 'quiz' : 'explore';
    const revealed = Array.isArray(parsed.revealed)
      ? parsed.revealed.filter(
          (id): id is CountryId => typeof id === 'string' && isCountryId(id),
        )
      : [];

    return {
      version: 1,
      revealed,
      mode,
      bestQuizScore:
        typeof parsed.bestQuizScore === 'number' ? parsed.bestQuizScore : 0,
    };
  } catch {
    return null;
  }
}

export function saveState(payload: Omit<PersistedMapState, 'version'>) {
  if (typeof localStorage === 'undefined') return;

  const persisted: PersistedMapState = {
    version: 1,
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
