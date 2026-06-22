# Portfolio Redesign Audit and Stitch Mockup Briefs

This file captures the current design audit and a set of Stitch-ready mockup prompts based on `design.md`.

## Current Design Audit

### Product and IA

The project is a static personal website with three main pages:

- `index.html`: primary dual-persona homepage.
- `projects.html`: project portfolio.
- `musician.html`: separate musician page.

The intended direction in `design.md` is one shared layout with two personas switched by a toggle. The homepage already has most of that architecture: day and night content live in the same DOM through `.persona-day` and `.persona-night`, and the toggle changes `data-theme`. However, `musician.html` still exists as a separate night-mode page, and the homepage still links to it from the persona teaser. This conflicts with the "dark/light mode switch, not a page change" requirement.

### Existing Visual System

The current day mode is dark tech-premium, not the requested Terra editorial direction. Day mode tokens define a navy/dark background, blue panels, white text, and orange accents. This directly contradicts the new requirement for warm paper/off-white surfaces, clay/terracotta accents, muted earth borders, deep charcoal text, and serif-forward typography.

Night mode is closer to the requested vaporwave/outrun direction. It uses the right general tokens: near-black purple void, magenta, cyan, orange, Orbitron, Share Tech Mono, CRT scanlines, neon borders, and perspective grid. It still needs restraint so the same page structure as day mode remains obvious. Night should feel like a themed mode of the same portfolio, not a completely different arcade website.

### Typography

Current day typography uses Inter and Space Grotesk. The new direction asks for Literata or a similar serif-forward hierarchy. This is a major redesign item, not a small token change. The day mockup should use a literary/editorial reading surface: large serif headings, calmer body rhythm, softer labels, and restrained UI chrome.

Night typography uses Orbitron for headings and Share Tech Mono for body/UI, which aligns with the brief. The redesign should keep this, but avoid overusing uppercase and glow on every text element because that can reduce readability.

### Hero and Photography

The hero image implementation is the strongest existing foundation. Both hero images are layered in the same `.hero-visual` container and swapped via `data-active`. The JavaScript deliberately avoids flipping `data-theme` mid-wave to prevent layout reflow and image jump.

The two required assets are:

- `images/ata-speaking.png` for day/professional.
- `images/ata-playing.png` for night/musician.

Both are cutout images on transparent/dark backgrounds and can work frameless. Their poses differ enough that the mockup must lock the visual container, scale logic, and object-position across both modes. The design must not place either image inside a card, photo frame, circle, blob, or bordered device mockup.

### Homepage Content Shape

The homepage is currently content-rich but too grid/card heavy:

- Hero with headline, lead, CTAs, and stats.
- Credibility strip.
- KPI row.
- Three-card capability section.
- Three-card featured work section.
- Timeline.
- Persona teaser.
- Footer.

The brief asks for a concise, marketable homepage with scanability. The redesign should reduce repeated card grids and replace them with more distinctive editorial sections:

- A strong first viewport where photography overlaps the title.
- One compact proof strip.
- A more curated "what I build / what I play" section.
- Selected work as fewer, stronger case-study panels.
- Experience as a short editorial timeline.
- A contact close.

### Projects Page

The project content model is strong and should be preserved:

- Problem
- Approach
- Outcome

The current UI is a stacked list of panels with many small rows. It is usable, but visually generic. Redesign should make each project feel like a compact case study with stronger hierarchy, better scannability, clear tags, and a consistent result/impact field.

### Interaction and Implementation Constraints

The theme switch logic is already carefully implemented:

- `localStorage` persists `as-persona`.
- `data-theme` controls CSS variables.
- `.hero-visual[data-active]` controls photo visibility separately from `data-theme`.
- Wave transition uses CSS masks and a full-screen sweep.
- Reduced motion is respected.

Mockups must preserve that implementation model. The design should define visual states for day, night, and transition, but must not require separate layout trees or independent hero image positioning per mode.

### Key Design Problems To Fix

- Day mode is visually off-brief: dark tech UI instead of warm Terra editorial.
- Homepage structure is too repetitive: card grid after card grid.
- There is still a separate musician page, which weakens the mode-switch concept.
- Current day and night styles feel like two skins of generic cards, not one premium concept.
- Hero photography is important but not yet treated as the central composition driver.
- The "two personas" story is present but too explicit and slightly gimmicky; it should feel confident and integrated.
- Projects page content is good but presentation lacks premium case-study polish.

## Shared Mockup Rules For Stitch

Use these rules in every Stitch prompt:

- Create a premium personal portfolio website for Ataberk Selekoglu.
- One shared layout with two personas: day is software engineer, night is musician/synthwave artist.
- Keep day and night structure almost identical. The difference is visual theme and persona copy, not layout.
- Include a visible persona toggle in the header. Do not include a separate "Musician" nav tab.
- Use the hero photography as the main visual anchor.
- Hero image must be frameless and must overlap the title area slightly from behind.
- Lock the hero image container across modes: same x/y position, same width, same height, same object-fit behavior, same crop behavior.
- Day hero uses `images/ata-speaking.png`.
- Night hero uses `images/ata-playing.png`.
- Do not put hero image inside a card, circle, phone mockup, laptop mockup, frame, blob, or bordered panel.
- Text must remain readable where the photo overlaps the title.
- Homepage should be concise, marketable, and highly scannable.
- Preserve project case-study structure: Problem, Approach, Outcome.
- Avoid generic bento grids, repeated card stacks, fake dashboards, fake metrics, and decorative filler icons.
- Use real code-native UI text and controls in the design.
- Respect reduced motion in final implementation, but the mockup should show the wave-like transition concept.

## Mockup 1 - Day Homepage Desktop

Paste this into Stitch:

```text
Design a desktop homepage mockup for a premium personal portfolio website for Ataberk Selekoglu.

Purpose:
Market Ataberk as a practical software engineer focused on AI workflows, integrations, automation, and full-stack delivery. The site has a second musician persona, but this mockup is the day/professional mode.

Visual direction:
Light Terra editorial interface, warm paper/off-white background, clay and terracotta accents, muted brown earth borders, deep charcoal text. Premium, calm, readable, literary, closer to a Claude-style reading surface than a tech startup landing page. Use a serif-forward hierarchy similar to Literata for headings and important body blocks. Use a very restrained neutral sans only for tiny UI labels, navigation, and toggle text.

Layout:
Create a single-page homepage with these sections in order:
1. Sticky transparent editorial header.
2. Hero section.
3. Compact credibility/proof strip.
4. "What I build" section with three concise capability modules.
5. Selected work section with three compact case-study panels.
6. Experience snapshot as a short editorial timeline.
7. Contact close.

Header:
Left: simple wordmark "Ataberk Selekoglu".
Nav: Home, Projects, Contact.
Right: persona toggle labeled "Professional" with a day/night switch.
Do not include a Musician nav tab.
Header should be quiet, thin, editorial, and not heavy.

Hero:
Use `images/ata-speaking.png` as the main image.
The hero image is frameless, cutout-style, positioned on the right, and overlaps the title area slightly from behind.
The image must not sit inside a card, frame, blob, circle, or bordered container.
The hero image container must be designed so the night image can occupy the exact same x/y position, width, height, scale, and crop behavior.

Hero copy:
Headline: "Practical AI and integration software, shipped end to end."
Support text: "I build AI workflows, middleware, and data automations that turn messy processes into dependable software."
Primary CTA: "View Projects"
Secondary CTA: "Get in touch"
Use only a small amount of proof text. Do not overcrowd the hero with many cards.

Hero composition:
Large editorial serif headline on the left, with the photo partially behind the right side of the headline. Keep text readable through layering, spacing, and subtle background treatments. The first viewport should feel art-directed and photographic.

Proof strip:
Show a quiet horizontal strip after the hero:
"Python", "JavaScript", "React", "Node.js", "LLMs", "SQL", "REST APIs".
Use understated separators, not pill overload.

What I build:
Three modules:
- AI product delivery
- Integrations and automation
- Full-stack delivery
Each module has a short 1-2 sentence description and restrained tags.
Avoid generic icon cards. Prefer editorial columns, index numbers, or rule-based modules.

Selected work:
Three case-study panels:
- ApplAI - turns a 2-hour tailoring task into minutes.
- HubSpot to Zoho bridge - eliminated double data entry across teams.
- Telecom churn model - ROC-AUC lifted from 0.74 to 0.84.
Each panel should preview Problem, Approach, Outcome in a polished, scannable way.

Experience:
Short timeline:
- AI Software Development (Co-op), Algonquin College, 2025 to now.
- Technical Business Analyst, Call Center Studio, 2021 to 2024.
- Management Trainee, Call Center Studio, 2020 to 2021.

Style details:
Warm paper background, subtle fiber/grain texture, wide margins, large readable type, generous whitespace, thin rules, terracotta links/buttons, muted clay surfaces, no neon, no dark panels.
Buttons should be refined and tactile, not SaaS-gradient.
Cards should be minimal and editorial, not generic rounded bento cards.
```

## Mockup 2 - Night Homepage Desktop

Paste this into Stitch:

```text
Design the night/musician version of the same Ataberk Selekoglu homepage. It must match the day homepage structure almost exactly, like a dark/light mode switch, not a separate page.

Purpose:
Show Ataberk as a bassist, songwriter, and synthwave-leaning performer while preserving the same portfolio flow.

Visual direction:
Vaporwave / outrun / retro-futuristic neon. Use background void `#090014`, text `#E0E0E0`, magenta `#FF00FF`, cyan `#00FFFF`, orange `#FF9900`, border `#2D1B4E`. Headings use Orbitron. Body and UI use Share Tech Mono. Use neon glow, gradient text, sharp geometric edges, a perspective grid floor, subtle CRT scanlines, and energetic hover states.

Important:
Keep the same layout skeleton as day mode:
1. Header.
2. Hero.
3. Compact proof/sound strip.
4. "How I create" section.
5. Selected sounds/performance highlights.
6. Music journey timeline.
7. Contact close.

Header:
Same wordmark and nav as day mode: Home, Projects, Contact.
No Musician tab.
Right toggle labeled "Musician".
Header can become sharper, neon, and glassy, but keep dimensions and placement close to day mode.

Hero:
Use `images/ata-playing.png` as the main image.
The hero image is frameless and must occupy the exact same container position, width, height, scale, crop, and object-fit behavior as the day hero image.
The image overlaps the title area slightly from behind.
No photo frame, card, circle, blob, or device mockup.

Hero copy:
Headline: "A synthwave bassist with a coder's precision and a stage performer's instinct."
Support text: "Off the keyboard I play bass, write, and perform. Years on stage and in studios shape how I approach everything I ship."
Primary CTA: "See music highlights"
Secondary CTA: "Booking / collab"

Proof strip:
Show a compact sound strip:
"Bass", "Guitar", "Vocals", "Songwriting", "Stage Performance", "Studio".
Use neon separators or terminal-like dividers, not a pill cloud.

How I create:
Three modules:
- Bass and groove
- Writing and production
- Stage performance
Same geometry and spacing as day mode, but with neon visual treatment.

Selected highlights:
Three panels:
- Live on stage - years of shows with bands and acoustic sets.
- Writing in synthwave - moody, melodic, rhythm-first original material.
- Collaborations - studio sessions, featured bass, and project collaborations.
Keep Problem/Approach/Outcome structure only for projects page, not this homepage highlight section.

Journey:
Short timeline:
- Bassist / Performer, ongoing.
- Songwriter / Home studio, ongoing.
- Early years, formation in the 2010s.

Style details:
Void background, perspective grid low in the page, subtle scanline overlay, magenta/cyan/orange glows, sharp geometric buttons, but keep readability high. Do not make every section a heavy neon box. The night version should feel like the same portfolio crossing into an outrun stage environment.
```

## Mockup 3 - Wave Transition State

Paste this into Stitch:

```text
Create a transition-state mockup for the Ataberk Selekoglu portfolio persona toggle.

Scene:
The site is halfway through switching from day/professional mode to night/musician mode.

Core requirement:
The transition should look like a wave-like animation passing across the page. During the wave, the hero image swap must be clean: no flicker, no jump, no pre/post flash, and no independent movement of either photo.

Visual:
Show the same homepage hero layout. On the left side of the wave, show the warm Terra day mode. On the right side of the wave, show the vaporwave night mode. The wave should be diagonal or organic, like an energetic sweep, not a hard straight wipe.

Hero:
Both hero photos occupy the exact same container:
- Day side: `images/ata-speaking.png`.
- Night side: `images/ata-playing.png`.
The two images should appear as one subject transforming in place. Same x/y position, same width, same height, same crop, same scale, same object-position.

Details:
The wave may carry subtle terracotta-to-magenta-to-cyan energy, but do not add a bright flash over the whole screen. Preserve readability of the headline. The design should communicate that implementation can use CSS masks and a full-screen sweep overlay.

Output:
One desktop hero mockup showing the mid-transition state.
```

## Mockup 4 - Projects Page Desktop

Paste this into Stitch:

```text
Design a desktop Projects page mockup for Ataberk Selekoglu's portfolio.

Purpose:
Show engineering projects as marketable case studies. Preserve a clear Problem, Approach, Outcome structure for every project.

Theme:
Use the day/professional Terra editorial mode. Warm paper/off-white background, deep charcoal text, clay/terracotta accents, muted brown borders, serif-forward hierarchy similar to Literata.

Header:
Use the same shared header as the homepage:
Ataberk Selekoglu wordmark, Home, Projects, Contact, persona toggle.
Projects nav item active.
No Musician tab.

Page intro:
Eyebrow or small label can say "Portfolio" only if it feels restrained.
Title: "Selected Projects"
Intro: "Each project is framed as problem, approach, and outcome so the value is clear fast."

Project layout:
Create a vertical sequence of premium case-study panels. Avoid generic card stacks. Use strong typography, subtle ruled columns, and visible hierarchy.

Each project panel must include:
- Project title
- Context/date
- Problem
- Approach
- Outcome
- Tags
- Links when available

Projects:
1. ApplAI - AI-assisted job application platform
Problem: Tailoring CVs and documents per role is slow, repetitive, and error-prone.
Approach: LLM pipelines, prompt stages, document generation.
Outcome: Turns a 2+ hour tailoring task into minutes.
Tags: Generative AI, Prompt engineering, Workflow automation.

2. ARPA Meal Planner - AI-assisted meal planning
Problem: Meal planning under nutrition, cost, and preference constraints is tedious.
Approach: Data modeling, filtering, recommendation logic.
Outcome: Produces coherent, constraint-aware meal options.
Tags: Data pipelines, Optimization, Scalable design.

3. Crime Insights in Dallas
Problem: 1.4M+ noisy, imbalanced police incident records.
Approach: CRISP-DM, classification, clustering, anomaly detection.
Outcome: Defensible insights from messy real-world data.
Tags: Machine learning, CRISP-DM, Data mining.

4. HubSpot to Zoho custom integration
Problem: Sales and delivery teams used different CRMs and data drifted.
Approach: Google Apps Script middleware, XML/JSON transformations, CRM object mapping.
Outcome: Cross-system data stayed in sync and manual work was removed.
Tags: Google Apps Script, REST APIs, CRM integration.

5. Telecom churn prediction
Problem: Imbalanced churn data under-detected at-risk customers.
Approach: SMOTE, ADASYN, class-weighted learning, CatBoost, XGBoost, LightGBM, Optuna.
Outcome: ROC-AUC lifted from 0.74 to 0.84.
Tags: Python, Scikit-learn, Optuna.

6. Chordy
Problem: Musicians want fast chord data for Spotify tracks.
Approach: Kotlin Android app, ExpressJS integration, Firebase auth.
Outcome: Working prototype connecting Spotify tracks to chord-data experience.
Tags: Kotlin, Android, ExpressJS, Firebase.

7. Email Signature Generator
Problem: New hires produced inconsistent email signatures.
Approach: Reusable HTML/CSS signature structure with lightweight JS.
Outcome: Consistent on-brand signatures with zero design effort per hire.
Tags: HTML, CSS, JavaScript.

Style:
Use spacious editorial rhythm. Each panel should be readable and premium. Make outcomes visually prominent without fake metrics. Keep the page highly scannable.
```

## Mockup 5 - Mobile Homepage

Paste this into Stitch:

```text
Design a mobile homepage mockup for Ataberk Selekoglu's dual-persona portfolio.

Viewport:
Mobile, approximately 390px wide.

Theme:
Show the day/professional Terra mode first, with a small preview indication that the same structure can switch to night mode.

Critical layout requirements:
The hero photo remains frameless and central to the composition.
Use `images/ata-speaking.png`.
The mobile hero must preserve the same image container logic that night mode uses for `images/ata-playing.png`: same width, same height, same x/y alignment, same object-fit, same object-position.
The photo can sit partially behind or between headline lines, but text must remain readable.

Header:
Compact wordmark.
Small persona toggle.
Nav can collapse into minimal links or a simple menu, but do not add a Musician tab.

Hero copy:
Headline: "Practical AI and integration software, shipped end to end."
Support text: concise, no long paragraph.
Primary CTA: View Projects.
Secondary CTA: Get in touch.

Sections:
After hero, show:
- Compact proof strip with stack terms.
- Three concise "What I build" modules stacked vertically.
- Selected work as one featured panel plus a "See all projects" link.
- Contact close.

Style:
Warm paper background, terracotta accent, deep charcoal text, serif-forward headline, generous vertical spacing, no cramped card pile. Mobile should feel premium and intentional, not just desktop squeezed down.
```

## Recommended Stitch Generation Order

1. Generate Mockup 1 first and refine until the day homepage is strong.
2. Generate Mockup 2 using the accepted day homepage as structural reference.
3. Generate Mockup 3 only after both endpoints are stable.
4. Generate Mockup 4 for the Projects page.
5. Generate Mockup 5 for mobile constraints.

## Acceptance Checklist

Use this checklist before implementation:

- Day mode is genuinely light Terra/editorial, not dark tech.
- Night mode is vaporwave/outrun but retains the same layout skeleton.
- Header has no Musician tab.
- Persona toggle is prominent enough to understand but not gimmicky.
- Hero images are frameless.
- Hero image alignment is locked across modes.
- Hero photo overlaps the title area slightly from behind.
- Text remains readable where the photo overlaps.
- Homepage is concise and not CV-like.
- Sections do not repeat the same generic card grid pattern.
- Projects preserve Problem, Approach, Outcome.
- Transition concept supports a wave-like CSS mask implementation.
- Mobile does not break the hero image alignment rule.
