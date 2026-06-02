# Map Guess Feature Completion Tasks

This backlog tracks what remains to make Map Guess feel like a complete game app rather than a polished prototype.

## Must Fix Before Calling It Feature Complete

- [x] Implement country name labels on reveal.
  - [x] Render labels declaratively in `Map.svelte` from revealed country ids.
  - [x] Add label anchor/centroid metadata to `countries.ts` or derive it reliably from SVG bounds.
  - [x] Prevent labels from overlapping badly at common zoom levels, especially Europe and island clusters.
  - [x] Make labels scale/read well without becoming huge at deep zoom.

- [x] Replace the `FIT` button stub with real fit-to-screen behavior.
  - [x] Compute scale and translation from the SVG viewBox and current viewport dimensions.
  - [x] Use the same fit behavior for initial load, reset, keyboard `F`, and the rail button.
  - [x] Respect safe areas and mobile panel placement.

- [x] Bring keyboard controls in line with the README.
  - [x] Add `+` / `=` zoom in.
  - [x] Add `-` / `_` zoom out.
  - [x] Add `F` fit-to-screen.
  - [x] Keep `R` random reveal and `Escape` reset.
  - [x] Avoid hijacking keys while focus is inside future text inputs or dialogs.

- [ ] Add a real game loop beyond free reveal mode.
  - [x] Add a "Find this country" mode with target country prompts.
  - [x] Score correct taps, misses, streaks, and completion percentage.
  - [ ] Add end-of-round summary with accuracy, time, and missed countries.
  - [x] Keep free explore mode available.

- [ ] Add persistent progress and preferences.
  - [ ] Save revealed countries, current mode, best scores, and selected settings in `localStorage`.
  - [x] Provide explicit "new game" and "clear saved progress" actions.
  - [x] Recover gracefully if saved data references removed or renamed country ids.

- [ ] Improve country data quality.
  - Verify total count and country/territory naming against the intended game scope.
  - Add display names, aliases, regions, continents, and optional difficulty tiers.
  - Decide whether disputed territories and microstates are in scope.
  - Add tests for unique ids and complete metadata.

## Gameplay Features

- [ ] Add mode selection.
  - [x] Explore: tap to reveal.
  - [x] Quiz: app asks for a country and the player taps it.
  - Region quiz: limit targets to a continent or region.
  - Speed round: timed challenge.

- [ ] Add hint mechanics.
  - Region/continent hint.
  - Neighbor or approximate location hint.
  - Optional zoom-to-region assist after repeated misses.
  - Track hint usage in score.

- [ ] Add feedback for player actions.
  - [x] Correct, incorrect, already revealed, and target changed states.
  - Lightweight animation that does not interfere with drag/pinch.
  - [x] Clear accessible status text for screen readers.

- [ ] Add completion and restart flows.
  - [x] Show a completion state when every target is revealed.
  - [ ] Offer play again, change mode, and review missed countries.
  - Avoid accidental reset with a confirm step when progress is non-empty.

## UI And Interaction Polish

- [ ] Add a proper app shell for game state.
  - [x] Current panel shows count and two actions only.
  - [ ] Add current target, timer/score when relevant, mode control, and compact settings.
  - [x] Keep map-first layout and avoid covering key map areas on mobile.

- [ ] Improve mobile ergonomics.
  - Test panel, rail, and hint positions on small phones, iPad portrait, and iPad landscape.
  - Consider moving zoom controls or collapsing them when the bottom panel is open.
  - Respect `env(safe-area-inset-*)`.

- [ ] Add icons for zoom and utility actions.
  - Replace text-only plus/minus/Fit controls with accessible icon buttons.
  - Keep visible labels only where they add clarity.

- [ ] Add settings.
  - Toggle labels always visible after reveal.
  - Toggle reduced animations.
  - Choose map scope: countries only vs. countries plus territories.
  - Choose theme/material intensity if the Liquid Glass treatment is too strong.

- [ ] Add loading and empty states.
  - Handle missing map data gracefully.
  - Show an initial ready state instead of relying only on the gesture hint.

## Accessibility

- [ ] Make the SVG map keyboard navigable.
  - Provide a searchable/list alternative for countries.
  - Allow reveal/select by keyboard without requiring pointer precision.
  - Add roving focus or a separate country list for screen-reader users.

- [ ] Add robust announcements.
  - [x] Announce revealed country name, score changes, current target, and completion.
  - Ensure progress updates are not too noisy.

- [ ] Audit color contrast across all map states.
  - Unrevealed land vs. ocean.
  - Revealed land vs. ocean.
  - Labels over land and ocean.
  - Liquid Glass controls over map content.

- [ ] Validate reduced-motion behavior.
  - Add `prefers-reduced-motion` styles.
  - Disable or shorten nonessential map/control animations.

## Technical Quality

- [ ] Replace loose `any` context usage with typed Svelte context helpers.
  - [x] Define a `MapState` interface/type in a shared module.
  - [ ] Use typed `setContext` / `getContext` wrappers.

- [ ] Move game state out of `App.svelte`.
  - [ ] Create a dedicated state module or class with tests.
  - [x] Keep view state, reveal state, mode state, and scoring state explicit.

- [ ] Add unit tests for gesture math.
  - `zoomAt`, `scaleAt`, `panToPointer`, `resetMicroPan`, pinch zoom/pan.
  - Edge cases for min/max scale and zero-size viewport.

- [ ] Add component tests for core gameplay.
  - Reveal by tapping a country.
  - Random reveal does not repeat.
  - Reset clears reveals and view.
  - Progress bar and count update correctly.

- [ ] Add end-to-end tests.
  - Desktop mouse pan/zoom/reveal.
  - Touch-style drag threshold vs. tap reveal.
  - Mobile viewport layout.
  - Keyboard controls.

- [ ] Add visual regression checks.
  - Desktop, phone, and tablet screenshots.
  - Reduced transparency / high contrast modes.
  - Initial, partially revealed, and completion states.

- [ ] Improve performance for large SVG interactions.
  - Confirm pan/zoom stays smooth on iPad.
  - Avoid expensive label/layout work during gesture frames.
  - Profile repeated reveals and all-countries-revealed state.

## Content And Deployment

- [ ] Fill in README screenshots.
  - Initial map.
  - Revealed-country state.
  - Quiz mode once implemented.

- [ ] Add deployment automation.
  - GitHub Actions build.
  - Pages deployment from `dist/` or a dedicated branch.
  - Cache npm dependencies.

- [ ] Add project metadata.
  - App icon/favicon.
  - Open Graph preview image.
  - Mobile web app metadata.

- [ ] Decide whether this should be installable as a PWA.
  - Add manifest.
  - Add offline caching if useful.
  - Test install behavior on iPad.

## Current Known Gaps From The Svelte Port

- [x] README still describes a "big banner" and revealed country names, but the Svelte app currently only changes country color and count.
- [x] `ZoomRail.svelte` has a simple center zoom and a stub fit implementation.
- [x] `Map.svelte` contains an empty labels layer.
- [x] `App.svelte` only handles `R` and `Escape`, despite README listing zoom and fit keyboard controls.
- [ ] No automated tests exist yet.
