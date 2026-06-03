import { COUNTRY_NAMES, TOTAL } from '$lib/data/countries';
import type { CountryId } from '$lib/data/countries';
import {
  modeStatusMessage,
  newGameMessage,
  nextTarget,
  targetForMode,
} from '$lib/game/gameSession';
import {
  exploreMode,
  quizMode,
  type GameModeController,
  type GameModeRuntime,
} from '$lib/game/gameModes';
import type { GameMode } from '$lib/game/gameTypes';
import {
  clearSavedState,
  loadSavedState,
  saveSavedState,
} from '$lib/game/mapPersistence';
import {
  randomUnrevealedCountry,
  revealCountry as revealCountryInSet,
} from '$lib/game/revealState';
import { createDefaultView, requestFitView } from '$lib/game/viewState';
import type { View } from '$lib/gestures/mapGestures';

function controllerForMode(mode: GameMode): GameModeController {
  return mode === 'quiz' ? quizMode : exploreMode;
}

export class MapState {
  revealed = $state(new Set<CountryId>());
  view = $state<View>(createDefaultView());
  mode = $state<GameMode>('explore');
  target = $state<CountryId | null>(null);
  correct = $state(0);
  misses = $state(0);
  streak = $state(0);
  bestStreak = $state(0);
  startedAt = $state(Date.now());
  completedAt = $state<number | null>(null);
  bestQuizScore = $state(0);
  lastMessage = $state('Ready');

  constructor() {
    const saved = loadSavedState();
    if (saved) {
      this.revealed = new Set(saved.revealed);
      this.mode = saved.mode;
      this.bestQuizScore = saved.bestQuizScore;
    }

    this.target = targetForMode(this.mode, this.revealed);
  }

  get total() {
    return TOTAL;
  }

  get count() {
    return this.revealed.size;
  }

  get completionPct() {
    return this.total > 0 ? Math.round((this.count / this.total) * 100) : 0;
  }

  get accuracy() {
    const attempts = this.correct + this.misses;
    return attempts > 0 ? Math.round((this.correct / attempts) * 100) : 100;
  }

  get elapsedSeconds() {
    const end = this.completedAt ?? Date.now();
    return Math.max(0, Math.floor((end - this.startedAt) / 1000));
  }

  get targetName() {
    return this.target ? COUNTRY_NAMES[this.target] : null;
  }

  get isComplete() {
    return this.count >= this.total;
  }

  get modeController() {
    return controllerForMode(this.mode);
  }

  get modeRuntime(): GameModeRuntime {
    return {
      getCompletedAt: () => this.completedAt,
      incrementCorrect: () => {
        this.correct += 1;
      },
      incrementMisses: () => {
        this.misses += 1;
      },
      getStreak: () => this.streak,
      setStreak: (streak) => {
        this.streak = streak;
      },
      setBestStreak: (bestStreak) => {
        this.bestStreak = Math.max(this.bestStreak, bestStreak);
      },
      getTarget: () => this.target,
      setTarget: (target) => {
        this.target = target;
      },
      getTargetName: () => this.targetName,
      revealCountry: (cid) => this.revealCountry(cid),
      setRevealed: (revealed) => {
        this.revealed = revealed;
      },
      finishIfComplete: () => this.finishIfComplete(),
      persist: () => this.persist(),
      setLastMessage: (message) => {
        this.lastMessage = message;
      },
      nextTarget,
      getRevealed: () => this.revealed,
    };
  }

  reveal(cid: CountryId) {
    this.modeController.handleCountryTap(this.modeRuntime, cid);
  }

  revealCountry(cid: CountryId) {
    const result = revealCountryInSet(this.revealed, cid);
    if (!result.changed) {
      this.lastMessage = result.message;
      return false;
    }

    this.revealed = result.revealed;
    this.lastMessage = result.message;
    this.finishIfComplete();
    this.persist();
    return true;
  }

  answer(cid: CountryId) {
    quizMode.handleCountryTap(this.modeRuntime, cid);
  }

  revealRandom() {
    if (!this.modeController.canRevealRandom) {
      this.lastMessage = 'Random reveal is available in Explore mode';
      return;
    }

    const cid = randomUnrevealedCountry(this.revealed);
    if (!cid) return;
    this.revealCountry(cid);
  }

  setMode(mode: GameMode) {
    if (this.mode === mode) return;

    this.mode = mode;
    this.newGame();
    this.target = targetForMode(mode, this.revealed);
    this.lastMessage = modeStatusMessage(mode);
    this.persist();
  }

  newGame() {
    const mode = this.mode;
    this.revealed = new Set();
    this.view = createDefaultView();
    requestFitView();
    this.correct = 0;
    this.misses = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.startedAt = Date.now();
    this.completedAt = null;
    this.mode = mode;
    this.target = targetForMode(this.mode, this.revealed);
    this.lastMessage = newGameMessage(this.mode);
    this.persist();
  }

  resetAll() {
    this.newGame();
  }

  clearSavedProgress() {
    clearSavedState();
    this.bestQuizScore = 0;
    this.newGame();
    this.lastMessage = 'Saved progress cleared';
    this.persist();
  }

  persist() {
    saveSavedState({
      revealed: Array.from(this.revealed),
      mode: this.mode,
      bestQuizScore: this.bestQuizScore,
    });
  }

  private finishIfComplete() {
    if (!this.isComplete || this.completedAt) return;

    this.completedAt = Date.now();
    this.target = null;
    if (this.mode === 'quiz') {
      this.bestQuizScore = Math.max(this.bestQuizScore, this.correct);
    }
    this.lastMessage = `Complete: ${this.accuracy}% accuracy in ${this.elapsedSeconds}s`;
  }
}
