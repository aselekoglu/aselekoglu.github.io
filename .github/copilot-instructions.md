# Copilot Instructions

## Repository shape
- This is a static multi-page portfolio site.
- Active shared pages are `index.html`, `projects.html`, and `musician.html`.
- Shared behavior lives in `assets/js/site.js`; the desktop hero morph lives in `assets/js/scroll-fly.js`; shared styling lives in `assets/css/site.css`.
- `ccs-signature-generator/` is a separate static mini-site with its own HTML/CSS/JS and its own design notes.

## Build, test, and lint
- No repo-local build, test, or lint scripts are defined.
- There is no `package.json` or equivalent toolchain config at the repo root.

## Architecture
- The site is driven by a single theme state on `<html data-theme="day|night">`, persisted in `localStorage` under `as-persona`.
- Day/night content is switched mostly with `.persona-day` / `.persona-night` classes and CSS variables rather than separate page logic.
- The main portfolio experience is built around a locked hero/avatar composition: the same two images stay aligned across breakpoints while `scroll-fly.js` morphs the avatar between the hero placeholder and the sidebar.
- Persona switching uses a clip-path sweep with a `theme-transition-mask` fallback and View Transitions API support; keep the `theme-transitioning` class and click-position CSS vars intact.
- `projects.html` uses filter buttons plus `data-categories` on cards; the URL query param `?category=` is part of the behavior.
- `assets/js/site.js` also handles PJAX, Mermaid re-rendering on theme changes, custom SoundCloud player wrapping, and the persona tooltip.

## Key conventions
- Keep the day/night layout nearly identical; add both persona variants when introducing new content.
- Preserve hero image filenames, crop behavior, and alignment (`images/ata-speaking-2.png` and `images/ata-playing.png`).
- Prefer CSS variables and existing shared classes over new inline styles.
- Keep semantic HTML and vanilla JS/CSS for the main site; do not introduce framework patterns for isolated changes.
- Treat the `ccs-signature-generator` signature table markup as compatibility-critical; update values through JS without changing the table structure or inline styling unless you are fixing that subsite intentionally.
- If you touch theme-related code, preserve the `window.initScrollFly` re-init hook and the `data-theme`/localStorage contract.
