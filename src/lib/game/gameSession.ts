import { COUNTRIES, type CountryId } from '$lib/data/countries';
import type { GameMode } from '$lib/game/gameTypes';

export function nextTarget(exclude: Set<CountryId>) {
  const remaining = COUNTRIES.filter((country) => !exclude.has(country.id));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)].id;
}

export function targetForMode(mode: GameMode, revealed: Set<CountryId>) {
  return mode === 'quiz' ? nextTarget(revealed) : null;
}

export function modeStatusMessage(mode: GameMode) {
  return mode === 'quiz'
    ? 'Find the highlighted target country'
    : 'Explore mode';
}

export function newGameMessage(mode: GameMode) {
  return mode === 'quiz' ? 'New quiz started' : 'New explore session';
}
