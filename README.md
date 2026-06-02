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

## Run locally

Just open `index.html` in a browser.

Or run a quick server:

```
python -m http.server
```

Then visit http://localhost:8000.

## Deploy to GitHub Pages

Push `index.html` + this README to the root of your repo on the `main` branch.

In GitHub repo → Settings → Pages:

- Source: "Deploy from a branch"
- Branch: `main` / (root)

Save and visit the URL (like `https://yourname.github.io/your-repo/`).

## Tech

Single-file vanilla app with JSDoc types. No build, no deps (Tailwind CDN only). Optimized for iPad/tablet + mobile with big touch targets and responsive layout.

## Screenshots

(Placeholder — drop nice screenshots of the grey starting map and some revealed countries here.)

## Credits

SVG map from [flekschas/simple-world-map](https://github.com/flekschas/simple-world-map) (based on public data, CC BY-SA).
