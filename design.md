# Engineering systems. Shaping sound.

## Direction

A single editorial identity for Ataberk Selekoglu, expressed through two disciplines. Professional uses paper, forest green, and architectural rings. Musician uses charcoal plum, lilac, and the same rings as a sound motif. Stage photography stays frameless. The speaker image was conservatively refined with Image Gen at the user’s request, preserving the original expression, hair, gesture, and framing. The original source is retained.

The homepage moves from an oversized headline and portrait to selected work, a concise personal introduction, and direct contact. The project archive preserves the existing case studies, catalog, dates, source links, and diagrams, with native disclosure controls to make it easier to scan.

## Design system

- Background: `#f6f7f4` / `#17151c`.
- Text: `#182620` / `#f4f1ea`.
- Accent: `#376449` / `#b7a1de`.
- Sans: Arial, Helvetica, system fallback. Emphasis: Georgia italic. Metadata: system monospace.
- Shared responsive container: 4.55vw gutters, 22px minimum, 1600px maximum content width.
- Hairline dividers, open editorial sections, restrained rectangular CTAs. Rounded geometry is reserved for persona controls, circular art, and the contact arrow.
- Hero portraits use one identical container, scale rule, and bottom alignment across both modes, with an opacity crossfade. The refined speaker asset has a white source background, composed with `mix-blend-mode: darken` to avoid a visible rectangular background on the paper surface.
- Breakpoints: 1150px, 800px, 540px. Mobile puts the offer and actions before the portrait.

## Interaction

The persistent Professional / Musician switch updates copy, imagery, colors, and navigation labels. Mouse, touch, Tab, Enter, Space, and arrow keys are supported. Selection is stored when localStorage is available and reflected in the URL. Reduced-motion preferences disable the wipe and smooth scrolling.

A CSS geometric wipe preserves live header controls during transitions. Full-document native view transitions were found to swallow rapid pointer events and are intentionally not used.

Project category filters synchronize the URL and pressed state. Direct case-study URLs reveal the right persona and open the relevant disclosure. Existing homepage anchors `overview`, `featured`, `skills`, and `contact` are retained.

SoundCloud loads after an explicit play action and uses one shared Widget API instance. Custom inline controls and a fixed bottom player share actual track metadata, playback, progress, seeking, volume, and playlist navigation. Playback continues across persona changes and internal navigation; Stop closes and unloads it. The SoundCloud attribution link remains available, including on connection failures. YouTube remains an on-demand embed and stops when its disclosure closes or the persona changes. Mermaid is also loaded on demand; diagram source remains readable if the optional renderer is unavailable.

## Files and scope

- `index.html`: dual-persona homepage.
- `musician.html`: direct musician entry with the original longer artist story and milestones.
- `projects.html`: preserved project and music content with the new shared layout.
- `assets/css/portfolio.css`: shared design tokens and responsive presentation.
- `assets/js/portfolio.js`: persona, filters, disclosures, and optional video/diagram embeds.
- `assets/js/music-player.js`: shared SoundCloud playback, custom controls, and internal navigation that preserves audio.

Legacy CSS and scripts remain available for the existing experimental pages. The signature generator is independent. This redesign introduces no build step or package installation and does not publish the site.

## September 5 refinements

The homepage capability panel replaces the Codex Router feature with AI workflows, full-stack products, and integrations. The redundant persona bridge is removed. Contact uses one email link. The About note reads: “Sometimes it starts with a problem. Sometimes with a melody.”
