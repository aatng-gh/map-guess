# Map Guess Architecture Plan

This plan focuses on making Map Guess easier to extend as a real game app:
more modes, better data, automated confidence, and fewer cross-component
couplings.

## Goals

- Keep the map interaction layer fast and isolated from gameplay rules.
- Make game modes pluggable instead of baking mode-specific behavior into the
  shared state class.
- Treat country data as validated domain data, not raw SVG metadata.
- Add tests at the math, state, component, and browser levels.
- Keep the UI map-first while allowing richer panels, settings, and progress.

## Current Shape

- `App.svelte` creates `MapState`, provides it through Svelte context, and owns
  global keyboard shortcuts.
- `Map.svelte` renders country SVG paths, revealed labels, and attaches
  `use:panzoom`.
- `panzoom.ts` owns pointer, wheel, double-click, fit, and keyboard zoom
  behavior.
- `mapState.svelte.ts` owns revealed countries, view state, modes, scoring,
  persistence, and round lifecycle.
- `countries.ts` stores country geometry, names, ids, and label anchors.

This is compact and works well for the MVP, but gameplay, persistence, view
state, and data validation are beginning to crowd the same state object.

## Checkpoint Status

- [x] Replace stale task backlog with this architecture plan.
- [x] Add Vitest and unit coverage for gesture math and core `MapState`
  behavior.
- [x] Add country data validation and tests for duplicate ids, required fields,
  SVG paths, and label anchors.
- [x] Add typed Svelte context helpers in `src/lib/context/mapContext.ts`.
- [x] Add a command layer for keyboard and UI control routing.
- [x] Introduce `GameModeController` and port Explore/Quiz tap handling to it.
- [x] Split `MapState` responsibilities into view, reveal, session, and
  persistence modules while keeping `MapState` as the UI facade.
- [x] Add versioned persistence adapters and migration tests.
- [ ] Add component and browser regression tests.

## Phase 1: Domain Boundaries

- Split `MapState` into smaller modules:
  - `viewStore`: pan, zoom, fit, viewport state.
  - `revealStore`: revealed country ids and reveal operations.
  - `gameSession`: active mode, target, scoring, streaks, timer, completion.
  - `preferencesStore`: labels, animation, material intensity, selected scope.
- Add typed Svelte context helpers in `src/lib/context/mapContext.ts`.
- Keep `panzoom.ts` unaware of gameplay; it should emit map-intent events such
  as `tapCountry`, `pan`, `zoom`, and `fit`.
- Move keyboard shortcut routing into a small command layer so shortcuts call
  named commands instead of reaching directly into stores.

Status: typed context helpers, command routing, and the first module split are
complete. Preferences remain folded into `MapState` until settings exist.

## Phase 2: Game Mode Architecture

- Define a `GameModeController` interface with:
  - `start(session)`
  - `handleCountryTap(countryId)`
  - `canRevealRandom`
  - `statusMessage`
  - `summary`
- Implement current modes as controllers:
  - `exploreMode`
  - `quizMode`
- Add region-scoped quiz as the first new mode after the split.
- Keep scoring rules inside mode controllers, not shared UI components.
- Make end-of-round summaries consume a normalized `GameSummary`.

Status: Explore/Quiz tap handling now lives behind `GameModeController`.
Controller lifecycle, summaries, and region modes are still pending.

## Phase 3: Country Data Model

- Add a build-time or test-time validator for `countries.ts`.
- Require each country record to have:
  - stable id
  - display name
  - region and continent
  - label anchor
  - paths
  - optional aliases
  - optional difficulty tier
- Decide and document scope: sovereign countries only, territories, disputed
  regions, and microstates.
- Add tests for duplicate ids, missing metadata, empty paths, and invalid label
  anchors.

Status: validation and required-field tests are complete. Region, continent,
alias, and difficulty metadata are still pending.

## Phase 4: Persistence And Migration

- Introduce versioned persistence adapters:
  - `loadSavedState()`
  - `saveSavedState()`
  - `migrateSavedState()`
  - `clearSavedState()`
- Persist only stable domain state, not transient gesture internals.
- Store preferences separately from active game progress.
- Add recovery paths for removed country ids and changed mode names.

Status: versioned load/save/migrate/clear adapters are complete for active game
progress. Preference persistence remains pending until settings exist.

## Phase 5: Test Layers

- Unit tests:
  - gesture math in `mapGestures.ts`
  - game controllers
  - persistence migration
  - country data validation
- Component tests:
  - panel mode switching
  - progress updates
  - target and score display
  - disabled/enabled action states
- Browser tests:
  - tap reveal
  - drag threshold does not reveal
  - wheel and rail zoom
  - keyboard shortcuts from normal page focus
  - mobile layout smoke checks
- Visual checks:
  - initial desktop
  - mobile portrait
  - quiz state
  - revealed labels
  - high contrast or reduced transparency

## Phase 6: Performance And UI Resilience

- Keep high-frequency pan and pinch updates out of Svelte render loops.
- Recompute label placement only when revealed ids or zoom buckets change.
- Add a lightweight viewport/layout service for safe-area and panel geometry.
- Avoid panel/map overlap regressions with browser layout assertions.
- Add `prefers-reduced-motion` handling for progress, reveal, and glass control
  transitions.

## Recommended Order

1. Add country data validation and gesture/game unit tests. Done.
2. Extract typed context helpers. Done.
3. Introduce command routing for keyboard and UI actions. Done.
4. Introduce `GameModeController` and port Explore/Quiz to it. Done.
5. Split `MapState` into view, reveal, session, and persistence modules. Done.
6. Add region quiz and end-of-round summary.
7. Add versioned persistence and migration tests. Done.
8. Add browser regression tests for the UI paths already manually verified.

## Definition Of Done

- New game modes can be added without editing map gesture code.
- Country metadata failures are caught by tests before runtime.
- Persistence changes are versioned and migration-tested.
- The Browser-tested interaction paths are covered by automated tests.
- The README points to this plan instead of carrying stale backlog details.
