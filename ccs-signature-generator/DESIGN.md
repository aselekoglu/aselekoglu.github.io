# Call Center Studio Brand Design System

This document outlines the visual language and design system of **Call Center Studio**, extracted from [callcenterstudio.com](https://callcenterstudio.com/). It serves as the foundation for the UI/UX overhaul of the Call Center Studio Email Signature Generator.

---

## 1. Brand Color Palette

The signature color system of Call Center Studio combines high-energy orange accents with sleek dark neutrals and soft, clean background shades.

| Color | Value | Usage |
|---|---|---|
| **CCS Orange** | `#F47A00` | Primary brand color, primary buttons, links, active states, focus outlines, and highlights. |
| **CCS Dark Charcoal** | `#181818` / `#111111` | Primary text, header background, dark container background, and dark buttons. |
| **CCS Soft Peach** | `#FFF1E3` | Light alert boxes, soft container highlights, and secondary background layers. |
| **CCS Light Grey** | `#F9F9F9` | Card background, input backgrounds, and alternating section backgrounds. |
| **CCS Charcoal Text** | `#404040` | Body text and subheaders. |
| **CCS Muted Grey** | `#818181` | Placeholders, secondary labels, and icon fills. |
| **CCS Success Green** | `#39B171` | Successful states, validation indicators, and copied notifications. |

---

## 2. Typography

Call Center Studio uses Google Fonts to establish a clean, modern, and highly readable editorial feel.

*   **Headers & Accents (Primary Font)**: `Poppins` (Google Fonts)
    *   *Weights*: `500` (Medium), `600` (Semi-Bold), `700` (Bold)
    *   *Character*: Strong, geometric, premium, and friendly.
*   **Body & Form Inputs (Secondary Font)**: `Inter` or `Helvetica Neue`, `Helvetica`, `Arial`, sans-serif
    *   *Weights*: `400` (Regular), `500` (Medium)
    *   *Character*: High legibility, neutral, clean layout.

---

## 3. UI Components & Layout Principles

### Cards & Container Borders
*   **Border Radius**: `12px` for content cards and panels, `8px` for inputs, fully rounded (`100px`) for badges and pill buttons.
*   **Box Shadow**: Soft, multi-layered shadows to give depth.
    *   *Example*: `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02);`
*   **Borders**: Thin borders (`1px solid #E5E7EB` or a very soft peach/orange accent outline like `1px solid rgba(244, 122, 0, 0.15)`).

### Form Fields (Inputs & Labels)
*   **Inputs**: Minimal, light-gray backgrounds (`#F9F9F9`) with no harsh borders. Subtle border transitions on focus.
    *   *Idle*: `border: 1px solid #E5E7EB; background-color: #F9F9F9; color: #181818;`
    *   *Focus*: `border-color: #F47A00; box-shadow: 0 0 0 4px rgba(244, 122, 0, 0.1); background-color: #FFFFFF;`
*   **Labels**: Styled with `Inter`, uppercase or semi-bold, size `12px` or `13px`, colors in CCS Charcoal Text (`#404040`) for clean form scanning.
*   **Toggles / Switches**: Smooth, pill-shaped toggles instead of standard browser checkbox controls, colored in CCS Orange on active states.

### Buttons & Call-to-Actions
*   **Primary Buttons**: Full CCS Orange background with white text, Poppins font, bold/medium weight.
    *   *Interactive State*: Scale-up scale(1.02) and translation transitions with a bright shadow glow on hover.
*   **Secondary/Copy Buttons**: Pill-shaped with solid neutral backgrounds or outlined borders, with transition states.
    *   *Copy Action*: Transitions to green (`#39B171`) when clicked, displaying a checkmark and "Copied!" feedback.

### Layout Rhythm
*   **Grid Structure**: Two-column layout on desktop:
    *   **Left Column (Form Controls)**: Clean card with a white/light grey surface holding the user profile fields.
    *   **Right Column (Signature Preview & Actions)**: Premium frame simulating an email editor with window controls (red/yellow/green pills) and a preview of the signature table, followed by styled copy controls.
*   **Responsive Flow**: Collapses smoothly into a single-column layout on viewport widths `< 1024px`.
