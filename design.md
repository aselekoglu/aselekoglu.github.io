# Website Design Direction

## Goal
Build a marketable personal website with one shared layout and two personas:
- **Day persona**: professional software engineer
- **Night persona**: musician / synthwave artist

The site should feel premium, minimalist, and distinctive, while remaining clear and readable. 
The main eye-catching element is the hero photography, and the entire experience should be designed around that.

## Core Experience
- Keep an **almost identical page structure** between personas.
- Switch personas with a **toggle**.
- Toggle transition should be a **premium geometric sweep (clip-path)** rather than a glitchy wave.
- During the sweep, the hero image swap must be clean (using opacity crossfade and scale-settling).
- The overall feeling should be close to a **dark/light mode switch**, not a page change.

## Hero Requirements
- Use:
  - `images/ata-speaking-2.png` for day/professional
  - `images/ata-playing.png` for night/musician
- Hero image remains **frameless**.
- Hero images are the primary visual anchor and are **non-negotiable in alignment**:
  - exact same container
  - exact same `x/y` position
  - exact same width and height
  - exact same scale logic across breakpoints
  - exact same crop behavior (`object-fit`/`object-position` strategy must stay consistent)
- The swap should look like one subject transforming in place, with the outgoing image slightly scaling up and the incoming image settling into place.
- Hero composition:
  - image overlaps title area slightly from behind
  - text stays readable while partially covered

## Visual Language (Architectural Logic)

### Unified Typography Stack
To maintain a high-end, premium feel across both personas, the typography remains unified, clean, and minimalist.
- **Primary Sans**: `Inter`, `system-ui`, `-apple-system`, `sans-serif`
  - Headers use tight leading/tracking for a locked-in, editorial feel.
- **Monospace**: `SFMono-Regular`, `Cascadia Code`, `Roboto Mono`, `monospace`
  - Used for tags, kickers, and metadata.

### Day Mode (Professional)
- **Palette**: Clean, modern editorial.
  - Background: Off-white/Paper (`#f8faf7`, `#ffffff`)
  - Text/Ink: Deep charcoal (`#16231f`)
  - Accents: Subdued earth/green/terra tones for a natural, refined feel.

### Night Mode (Musician)
- **Palette**: Dark, premium synthwave.
  - Background: Deep black/charcoal (`#0c0c0c` or `#090014`)
  - Text: Stark white/light gray (`#E0E0E0`)
  - Accents: Subtle neon violet, cyan, or magenta, strictly controlled to avoid looking messy.

## Content Strategy
- Keep homepage concise and marketable.
- Prioritize scanability:
  - clear headline
  - short support text
  - strong proof blocks / cards
- Avoid CV-like long paragraphs on homepage.
- Projects page structure:
  - Problem
  - Approach
  - Outcome

## UX / Accessibility
- Keep transitions performant and smooth using hardware-accelerated properties (transform, opacity, clip-path).
- Respect reduced-motion preferences.
- Maintain readable contrast in both modes.
- Typography choreography: ensure persona-specific text shifts slightly rather than jumping abruptly during the switch.

## Implementation Constraints
- Centralize tokens in CSS variables by mode.
- Avoid one-off inline styling.
- Keep styles reusable and coherent.
- Do not break day/night toggle behavior or hero sweep transition logic.
- Do not move hero elements independently per mode; alignment must be locked.
