import { COUNTRY_NAMES, type CountryId } from '$lib/data/countries';
import { nextTarget } from '$lib/game/gameSession';
import type { GameMode } from '$lib/game/gameTypes';

export interface GameModeRuntime {
  getCompletedAt: () => number | null;
  getCorrect: () => number;
  getAccuracy: () => number;
  getElapsedSeconds: () => number;
  incrementCorrect: () => void;
  incrementMisses: () => void;
  getStreak: () => number;
  setStreak: (streak: number) => void;
  setBestStreak: (bestStreak: number) => void;
  getTarget: () => CountryId | null;
  setTarget: (target: CountryId | null) => void;
  getTargetName: () => string | null;
  revealCountry: (cid: CountryId) => boolean;
  recordUndoCheckpoint: () => void;
  setRevealed: (revealed: Set<CountryId>) => void;
  finishIfComplete: () => void;
  persist: () => void;
  setLastMessage: (message: string) => void;
  setIncorrectPick: (cid: CountryId) => void;
  nextTarget: (exclude: Set<CountryId>) => CountryId | null;
  getRevealed: () => Set<CountryId>;
  setBestQuizScore: (score: number) => void;
}

export interface GameSummary {
  title: string;
  detail: string;
}

export interface GameModeController {
  canRevealRandom: boolean;
  initialTarget: (revealed: Set<CountryId>) => CountryId | null;
  statusMessage: string;
  newGameMessage: string;
  complete: (runtime: GameModeRuntime) => string;
  summary: (runtime: GameModeRuntime) => GameSummary;
  handleCountryTap: (runtime: GameModeRuntime, cid: CountryId) => void;
}

export function controllerForMode(mode: GameMode): GameModeController {
  return mode === 'quiz' ? quizMode : exploreMode;
}

export const exploreMode: GameModeController = {
  canRevealRandom: true,
  initialTarget: () => null,
  statusMessage: 'Explore mode',
  newGameMessage: 'New explore session',
  complete(runtime) {
    return `Complete in ${runtime.getElapsedSeconds()}s`;
  },
  summary(runtime) {
    return {
      title: 'Round complete',
      detail: `Completed in ${runtime.getElapsedSeconds()}s`,
    };
  },
  handleCountryTap(runtime, cid) {
    runtime.revealCountry(cid);
  },
};

export const quizMode: GameModeController = {
  canRevealRandom: false,
  initialTarget(revealed) {
    return nextTarget(revealed);
  },
  statusMessage: 'Find the highlighted target country',
  newGameMessage: 'New quiz started',
  complete(runtime) {
    runtime.setBestQuizScore(runtime.getCorrect());
    return `Complete: ${runtime.getAccuracy()}% accuracy in ${runtime.getElapsedSeconds()}s`;
  },
  summary(runtime) {
    return {
      title: 'Round complete',
      detail: `${runtime.getAccuracy()}% accuracy in ${runtime.getElapsedSeconds()}s`,
    };
  },
  handleCountryTap(runtime, cid) {
    const target = runtime.getTarget();
    if (!target || runtime.getCompletedAt()) return;

    if (cid === target) {
      const nextRevealed = new Set([...runtime.getRevealed(), cid]);
      runtime.recordUndoCheckpoint();
      runtime.setRevealed(nextRevealed);
      runtime.incrementCorrect();
      runtime.setStreak(runtime.getStreak() + 1);
      runtime.setBestStreak(runtime.getStreak());
      runtime.setLastMessage(`Correct: ${COUNTRY_NAMES[cid]}`);
      runtime.setTarget(runtime.nextTarget(nextRevealed));
      runtime.finishIfComplete();
      runtime.persist();
      return;
    }

    runtime.incrementMisses();
    runtime.setStreak(0);
    runtime.setIncorrectPick(cid);
    runtime.setLastMessage(`${COUNTRY_NAMES[cid]} is not ${runtime.getTargetName()}`);
  },
};
