import { COUNTRY_NAMES, TOTAL } from '$lib/data/countries';
import type { CountryId } from '$lib/data/countries';
import { nextTarget } from '$lib/game/gameSession';
import {
  controllerForMode,
  quizMode,
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

interface GameSnapshot {
  revealed: Set<CountryId>;
  target: CountryId | null;
  correct: number;
  misses: number;
  streak: number;
  bestStreak: number;
  completedAt: number | null;
  bestQuizScore: number;
  lastMessage: string;
}

const MAX_HISTORY = 200;

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
  incorrectPick = $state<CountryId | null>(null);
  incorrectPickPulse = $state(0);
  private history = $state<GameSnapshot[]>([]);

  constructor() {
    const saved = loadSavedState();
    if (saved) {
      this.revealed = new Set(saved.revealed);
      this.mode = saved.mode;
      this.bestQuizScore = saved.bestQuizScore;
    }

    this.target = this.modeController.initialTarget(this.revealed);
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

  get canUndo() {
    return this.history.length > 0;
  }

  get modeController() {
    return controllerForMode(this.mode);
  }

  get summary() {
    return this.modeController.summary(this.modeRuntime);
  }

  get modeRuntime(): GameModeRuntime {
    return {
      getCompletedAt: () => this.completedAt,
      getCorrect: () => this.correct,
      getAccuracy: () => this.accuracy,
      getElapsedSeconds: () => this.elapsedSeconds,
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
      setBestQuizScore: (score) => {
        this.bestQuizScore = Math.max(this.bestQuizScore, score);
      },
      getTarget: () => this.target,
      setTarget: (target) => {
        this.target = target;
      },
      getTargetName: () => this.targetName,
      revealCountry: (cid) => this.revealCountry(cid),
      recordUndoCheckpoint: () => this.recordUndoCheckpoint(),
      setRevealed: (revealed) => {
        this.revealed = revealed;
      },
      finishIfComplete: () => this.finishIfComplete(),
      persist: () => this.persist(),
      setLastMessage: (message) => {
        this.lastMessage = message;
      },
      setIncorrectPick: (cid) => this.markIncorrectPick(cid),
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

    this.recordUndoCheckpoint();
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
    this.target = this.modeController.initialTarget(this.revealed);
    this.lastMessage = this.modeController.statusMessage;
    this.persist();
  }

  undoLastAction() {
    const snapshot = this.history.at(-1);
    if (!snapshot) {
      this.lastMessage = 'Nothing to undo';
      return false;
    }

    this.history = this.history.slice(0, -1);
    this.revealed = new Set(snapshot.revealed);
    this.target = snapshot.target;
    this.correct = snapshot.correct;
    this.misses = snapshot.misses;
    this.streak = snapshot.streak;
    this.bestStreak = snapshot.bestStreak;
    this.completedAt = snapshot.completedAt;
    this.bestQuizScore = snapshot.bestQuizScore;
    this.incorrectPick = null;
    this.lastMessage = 'Undid last reveal';
    this.persist();
    return true;
  }

  newGame() {
    const mode = this.mode;
    this.revealed = new Set();
    this.history = [];
    this.view = createDefaultView();
    requestFitView();
    this.correct = 0;
    this.misses = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.startedAt = Date.now();
    this.completedAt = null;
    this.incorrectPick = null;
    this.incorrectPickPulse = 0;
    this.mode = mode;
    this.target = this.modeController.initialTarget(this.revealed);
    this.lastMessage = this.modeController.newGameMessage;
    this.persist();
  }

  resetAll() {
    this.newGame();
  }

  clearSavedProgress() {
    clearSavedState();
    this.bestQuizScore = 0;
    this.history = [];
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
    this.lastMessage = this.modeController.complete(this.modeRuntime);
  }

  private markIncorrectPick(cid: CountryId) {
    this.incorrectPick = cid;
    this.incorrectPickPulse += 1;
  }

  private recordUndoCheckpoint() {
    const snapshot: GameSnapshot = {
      revealed: new Set(this.revealed),
      target: this.target,
      correct: this.correct,
      misses: this.misses,
      streak: this.streak,
      bestStreak: this.bestStreak,
      completedAt: this.completedAt,
      bestQuizScore: this.bestQuizScore,
      lastMessage: this.lastMessage,
    };

    this.history = [...this.history, snapshot].slice(-MAX_HISTORY);
  }
}
