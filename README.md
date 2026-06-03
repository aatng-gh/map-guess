# Map Guess

A friendly tap-to-reveal world map game.

## How to play

Starts with every country grey and unlabeled.

Tap any country (or territory) to color it and reveal its name on the map and in the big banner.

Tap as many as you like — it's a fun way to explore or test your geography. Re-tapping is harmless. Hit the Reset button to start fresh.

The map is full-page and fully interactive:
- Drag (mouse or finger) to pan anywhere.
- Scroll wheel, trackpad, or pinch to zoom in/out.
- Use the + / − / FIT buttons in the top bar, or press F on keyboard to fit.
- Double-click / double-tap to zoom in at that spot.
- Zoom in close to easily tap small countries and islands.

All gestures work great on iPad (primary target) and phones.

## Controls

- **Top bar**: Live reveal counter, zoom + / − / FIT, Random (reveal a random unrevealed country), Reset (clear all reveals).
- **Map gestures**: Drag to pan, wheel/pinch to zoom, double-tap to zoom, tap countries to reveal.
- Keyboard: +/− for zoom, F to fit, R for random, Esc to reset reveals.

## Run locally (Svelte)

```bash
npm install
npm run dev
```

Visit http://localhost:5173.

Build for production:

```bash
npm run build
```

The static output in `dist/` can be served by any static host.

## Deploy to GitHub Pages

1. `npm run build`
2. Push the `dist/` contents (or use a GitHub Action that builds and deploys `dist`).

Or enable Pages "Deploy from a branch" pointing at a `gh-pages` branch containing the built files.

## Tech

Svelte 5 (runes mode) + Vite + TypeScript + Tailwind.

- Data-driven declarative SVG map (extracted country paths + groups).
- Reworked pointer events + state in a reusable `use:panzoom` action (world-anchored pan, pinch, threshold-based tap suppression, no-drift math).
- Apple Liquid Glass design language (unified frosted materials, specular highlights, coherent tokens, vibrant yet harmonious palette).
- No runtime DOM mutation for reveals (pure reactive classes + Svelte each).
- iPad/touch-first with large targets and robust gesture separation.

Original single-file vanilla implementation preserved as `index.vanilla.html` for reference.

## Architecture

See [`docs/ARCHITECTURE_PLAN.md`](docs/ARCHITECTURE_PLAN.md) for the current plan to split gameplay, map interaction, persistence, country data, and tests into clearer system boundaries.

## Screenshots

(Placeholder — drop nice screenshots of the grey starting map and some revealed countries here.)

## Credits

SVG map from [flekschas/simple-world-map](https://github.com/flekschas/simple-world-map) (based on public data, CC BY-SA).
