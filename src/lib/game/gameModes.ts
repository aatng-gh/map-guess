import { COUNTRY_NAMES, type CountryId } from '$lib/data/countries';

export interface GameModeRuntime {
  getCompletedAt: () => number | null;
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
}

export interface GameModeController {
  canRevealRandom: boolean;
  handleCountryTap: (runtime: GameModeRuntime, cid: CountryId) => void;
}

export const exploreMode: GameModeController = {
  canRevealRandom: true,
  handleCountryTap(runtime, cid) {
    runtime.revealCountry(cid);
  },
};

export const quizMode: GameModeController = {
  canRevealRandom: false,
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
