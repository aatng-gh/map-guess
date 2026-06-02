import { ALL_IDS, COUNTRIES, COUNTRY_NAMES, TOTAL } from '$lib/data/countries';
import type { CountryId } from '$lib/data/countries';
import type { View } from '$lib/gestures/mapGestures';

export type GameMode = 'explore' | 'quiz';

interface PersistedMapState {
  version: 1;
  revealed: CountryId[];
  mode: GameMode;
  bestQuizScore: number;
}

const STORAGE_KEY = 'map-g:mvp-state';
const DEFAULT_VIEW: View = { tx: 0, ty: 0, scale: 1 };

function requestFitView() {
  if (typeof window === 'undefined') return;

  window.requestAnimationFrame(() => {
    window.dispatchEvent(new window.CustomEvent('map:fit-view'));
  });
}

function isCountryId(id: string): id is CountryId {
  return ALL_IDS.has(id);
}

function nextTarget(exclude: Set<CountryId>) {
  const remaining = COUNTRIES.filter((country) => !exclude.has(country.id));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)].id;
}

function readSavedState(): PersistedMapState | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedMapState>;
    const mode = parsed.mode === 'quiz' ? 'quiz' : 'explore';
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

export class MapState {
  revealed = $state(new Set<CountryId>());
  view = $state<View>({ ...DEFAULT_VIEW });
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
    const saved = readSavedState();
    if (saved) {
      this.revealed = new Set(saved.revealed);
      this.mode = saved.mode;
      this.bestQuizScore = saved.bestQuizScore;
    }

    this.target = this.mode === 'quiz' ? nextTarget(this.revealed) : null;
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

  reveal(cid: CountryId) {
    if (this.mode === 'quiz') {
      this.answer(cid);
      return;
    }

    this.revealCountry(cid);
  }

  revealCountry(cid: CountryId) {
    if (!isCountryId(cid)) return false;
    if (this.revealed.has(cid)) {
      this.lastMessage = `${COUNTRY_NAMES[cid]} already revealed`;
      return false;
    }

    this.revealed = new Set([...this.revealed, cid]);
    this.lastMessage = `Revealed ${COUNTRY_NAMES[cid]}`;
    this.finishIfComplete();
    this.persist();
    return true;
  }

  answer(cid: CountryId) {
    if (!this.target || this.completedAt) return;

    if (cid === this.target) {
      const nextRevealed = new Set([...this.revealed, cid]);
      this.revealed = nextRevealed;
      this.correct += 1;
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.lastMessage = `Correct: ${COUNTRY_NAMES[cid]}`;
      this.target = nextTarget(nextRevealed);
      this.finishIfComplete();
      this.persist();
      return;
    }

    this.misses += 1;
    this.streak = 0;
    this.lastMessage = `${COUNTRY_NAMES[cid]} is not ${this.targetName}`;
  }

  revealRandom() {
    if (this.mode === 'quiz') {
      this.lastMessage = 'Random reveal is available in Explore mode';
      return;
    }

    const unrevealed = Array.from(ALL_IDS).filter(
      (id) => !this.revealed.has(id),
    );
    if (unrevealed.length === 0) return;
    this.revealCountry(
      unrevealed[Math.floor(Math.random() * unrevealed.length)],
    );
  }

  setMode(mode: GameMode) {
    if (this.mode === mode) return;

    this.mode = mode;
    this.newGame();
    this.target = mode === 'quiz' ? nextTarget(this.revealed) : null;
    this.lastMessage =
      mode === 'quiz' ? 'Find the highlighted target country' : 'Explore mode';
    this.persist();
  }

  newGame() {
    const mode = this.mode;
    this.revealed = new Set();
    this.view = { ...DEFAULT_VIEW };
    requestFitView();
    this.correct = 0;
    this.misses = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.startedAt = Date.now();
    this.completedAt = null;
    this.mode = mode;
    this.target = this.mode === 'quiz' ? nextTarget(this.revealed) : null;
    this.lastMessage =
      this.mode === 'quiz' ? 'New quiz started' : 'New explore session';
    this.persist();
  }

  resetAll() {
    this.newGame();
  }

  clearSavedProgress() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.bestQuizScore = 0;
    this.newGame();
    this.lastMessage = 'Saved progress cleared';
    this.persist();
  }

  persist() {
    if (typeof localStorage === 'undefined') return;

    const payload: PersistedMapState = {
      version: 1,
      revealed: Array.from(this.revealed).filter(isCountryId),
      mode: this.mode,
      bestQuizScore: this.bestQuizScore,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
