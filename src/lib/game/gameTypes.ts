import type { CountryId } from '$lib/data/countries';

export type GameMode = 'explore' | 'quiz';

export interface PersistedMapState {
  version: 1;
  revealed: CountryId[];
  mode: GameMode;
  bestQuizScore: number;
}
