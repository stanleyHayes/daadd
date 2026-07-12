# NEMESIS Design System

Visual language for all NEMESIS user interfaces (web + mobile). Built on **MUI v9** with **CSS Modules** for custom styling. Inspired by modern dashboard/SaaS aesthetics: airy whitespace, rounded geometry, soft pastel surfaces, pill controls.

This document is the source of truth. Any agent building UI MUST conform.

> **Scope note.** MUI v9 already provides every primitive we need (`Button`, `TextField`, `Chip`, `Avatar`, `Paper`, `IconButton`, etc.). **Do not rebuild primitives.** This spec defines:
> 1. **Theme overrides** (palette, typography, shadows, `components.*` style overrides) — see §2–§5, §12.
> 2. **Composite patterns** that don't exist in MUI — `StatusCard`, `ListRow`, `StatTile`, `AppShell`, `SideNav`, etc. — see §6, §18.
> 3. **Behavioral rules** (states, screen states, composition limits) that apply to both — see §15, §16, §19.
>
> If a desired look can be achieved by overriding an MUI component via `theme.components.MuiX.styleOverrides`, that is the correct path. Only add a wrapper component when MUI cannot express the pattern through props + style overrides alone.

---

## 1. Core Principles

1. **Generous whitespace.** Padding > density. Default card padding is 24px, not 12px.
2. **Soft, rounded geometry.** Cards = 20–24px radius. Buttons/inputs/chips = full pill (999px). Nothing square except images inside rounded frames.
3. **Layered, not bordered.** Use subtle elevation (soft shadows) and tinted backgrounds to separate surfaces. Avoid hairline borders.
4. **Tinted status surfaces.** Statuses are communicated with a soft pastel card background + matching pill chip, not just text color.
5. **One accent at a time.** A screen has one primary accent action. Everything else is neutral or tinted.
6. **Type does the heavy lifting.** Large, confident headings. Body stays modest. No decorative fonts.

---

## 2. Color Tokens

Defined once in the MUI theme. Never hard-code hex values in components.

### Brand
| Token | Light | Dark | Use |
|---|---|---|---|
| `primary.main` | `#1869FF` | `#1869FF` | Primary actions, links, focused states |
| `primary.contrastText` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| `secondary.main` | `#8B7FE8` | `#A99CFF` | Secondary accent (lavender — NEMESIS heritage) |

### Neutrals (surfaces & text)
| Token | Light | Dark |
|---|---|---|
| `background.default` | `#F5F5F7` | `#0B0B14` |
| `background.paper` | `#FFFFFF` | `#15151F` |
| `background.subtle` (custom) | `#EFEFF2` | `#1B1B27` |
| `text.primary` | `#0A0A12` | `#F5F5F7` |
| `text.secondary` | `#6B6B7B` | `#A0A0B0` |
| `divider` | `rgba(10,10,18,0.06)` | `rgba(255,255,255,0.08)` |

### Status (semantic — pastel surface + saturated chip text)
| Status | Surface (card bg) | Chip text | Chip bg |
|---|---|---|---|
| Active / Success | `#E8F8F0` | `#0A8A4F` | `#C9F0DA` |
| Pending / Warning | `#FFF4E0` | `#B8741A` | `#FFE3B0` |
| Critical / Danger | `#FDE7E7` | `#C2382F` | `#F8C9C5` |
| Info / Hot Prospect | `#EAE7FB` | `#5847C9` | `#D5CFF5` |
| Neutral | `#F0F0F4` | `#4A4A58` | `#E0E0E6` |

Status surfaces are large soft cards (see §6). Chips are small pills inside those cards.

### Accent palette (charts, illustrations, category tags)
`#1869FF` (blue), `#8DFC63` (lime), `#FF6161` (coral), `#79E2D7` (mint), `#FFB547` (amber), `#DD74B1` (pink). Use only for data viz and categorical labels — never for UI chrome.

---

## 3. Typography

**Two fonts** across every NEMESIS surface (citizen app, marketing site, mobile):

| Role | Font | Self-host source |
|---|---|---|
| **Display** (headings `h1`–`h4`) | `TT Squares` | OTFs in `apps/marketing/public/fonts/`; convert to WOFF2 at build time |
| **Body** (everything else — subtitles, body, captions, buttons, inputs) | `Outfit` | `@fontsource/outfit` (Latin subset) |

Fallback stack: `Outfit, -apple-system, "Segoe UI", Roboto, sans-serif` for body; `"TT Squares", Outfit, sans-serif` for display.

Weights used: **400 Regular**, **500 Medium**, **700 Bold** (both families). No italics in UI chrome.

In the MUI theme: `typography.fontFamily` = Outfit; `typography.h1..h4.fontFamily` override to `"TT Squares"`. The marketing site duplicates this so headlines feel native.

### Scale (MUI `typography` overrides)
| Variant | Size / Line height | Weight | Use |
|---|---|---|---|
| `h1` | 40 / 48 | 700 | Page hero only (rare) |
| `h2` | 32 / 40 | 700 | Page titles ("Keep in touch coach") |
| `h3` | 24 / 32 | 700 | Section titles |
| `h4` | 20 / 28 | 700 | Card titles |
| `subtitle1` | 16 / 24 | 500 | Sub-labels above values |
| `body1` | 15 / 22 | 400 | Default body |
| `body2` | 13 / 20 | 400 | Secondary / meta |
| `caption` | 12 / 16 | 500 | Timestamps, helper text |
| `button` | 14 / 20 | 500 | Buttons (no uppercase — `textTransform: 'none'`) |

Letter spacing: `-0.01em` on h1–h4. Default on body.

---

## 4. Spacing & Layout

MUI base spacing unit = **4px**. Always use `theme.spacing(n)` — never raw px in `sx`.

### Layout grid (desktop)
- **Side nav width:** 232px
- **Outer page margin:** 20px
- **Column gutter:** 24px
- **12-column grid** inside the main content area
- **Max content width:** 1440px (then center)

### Card padding
- **Default card:** 24px all sides
- **Compact card** (list item, chip cluster): 16px
- **Hero card** (top of dashboard): 32px

### Vertical rhythm between sections
- Section to section: **32px**
- Card to card within a section: **20px**
- Items inside a list: **12px**

---

## 5. Radii & Elevation

### Border radius
| Element | Radius |
|---|---|
| Cards / panels | **20px** |
| Hero card | **24px** |
| Inputs / search bars | **999px** (pill) |
| Buttons | **999px** (pill) |
| Chips / status pills | **999px** |
| Avatar | **50%** (circle) |
| Avatar group thumbnail in cards (small property/photo) | **12px** |
| Icon buttons (circular) | **50%** |

### Shadows (define as theme `shadows` overrides)

```
shadow.sm  = 0 1px 2px rgba(10,10,18,0.04), 0 1px 1px rgba(10,10,18,0.03)
shadow.md  = 0 4px 16px rgba(10,10,18,0.06)
shadow.lg  = 0 12px 32px rgba(10,10,18,0.08)
shadow.xl  = 0 24px 48px rgba(10,10,18,0.10)
```

- Resting cards: `shadow.sm`
- Floating panels / popovers: `shadow.md`
- Modals / hero callouts: `shadow.lg`
- Dialog: `shadow.xl`

Never use MUI's default heavy shadows — override them.

---

## 6. Component Patterns

### 6.1 Page shell

```
┌─────────────────────────────────────────────────────────┐
│  LOGO          [ Search pill ............ ⌘ 🎙 ]   ⚙ 🔔 👤  │  ← top bar, 72px
├──────────┬──────────────────────────────────────────────┤
│          │  H2 Title                                    │
│  Nav     │                                              │
│  (232px) │  ┌─ Hero card ─────────────┐  ┌─ Aside ─┐    │
│          │  │                          │  │         │    │
│          │  └──────────────────────────┘  │         │    │
└──────────┴──────────────────────────────────────────────┘
```

- Top bar: white, no border, `shadow.sm`, full-width search pill in center.
- Side nav: white, grouped sections (`Menu`, `Productivity`, `Business`, `Integrations`) with collapsible headers.
- Active nav item: **black pill** (filled `#0A0A12`, white text/icon), 999px radius, full width of nav minus padding.
- Inactive nav item: text only, icon in a soft circular chip (`background.subtle`).

### 6.2 Card

```tsx
<Paper elevation={0} sx={{
  p: 3,                    // 24px
  borderRadius: '20px',
  bgcolor: 'background.paper',
  boxShadow: (t) => t.shadows[1],   // our sm
}}>
```

No border. Hover: lift to `shadow.md`, no color change.

### 6.3 Buttons
- **Primary:** filled `primary.main`, white text, pill, 44px height, 24px horizontal padding. Used 0–1 times per view.
- **Dark primary** (alternate, as in "Prospecting Update" button): filled `#0A0A12`, white text, pill — used for the most prominent CTA on neutral surfaces.
- **Secondary:** outlined, transparent bg, `text.primary` border at 1px, pill. Used for "Quick Task" etc.
- **Ghost / icon-only:** circular 40px, `background.subtle` bg, neutral icon. Hover: deepen bg one step.
- **Floating action chips** (the "↗ expand" buttons on cards): 36px circular, white bg, `shadow.sm`, neutral icon.

Never use uppercase. Never use MUI's default ripple+drop shadow combo.

### 6.4 Inputs
- All text fields: pill (`borderRadius: 999px`), 44px height, 20px horizontal padding.
- Leading icon: muted, 18px, 12px from left edge.
- Filled variant on white surfaces, with `background.subtle` fill on `background.paper` surfaces. No outline.
- Focus: 2px `primary.main` ring offset, no border color change.

### 6.5 Status card pattern (the heart of the system)
A status card is a soft-tinted rectangle showing one entity + their state.

```
┌────────────────────────────┐
│  [👤] Charis Kata        ↗ │   ← avatar + name + expand button
│       Hot Prospect          │   ← role / context (text.secondary)
│                             │
│  Update                     │   ← label (caption, text.secondary)
│  16 Mar, 01:34 PM    [Active] │ ← timestamp + status chip
└────────────────────────────┘
```

- Background: tinted surface from §2 (Active = mint, Pending = peach, Critical = pink, Info = lavender).
- Radius: 20px. Padding: 20px. No shadow (the tint *is* the separation).
- Chip in bottom right: matching saturated color, pill, 12px text.

### 6.6 List row (Follow-up Task pattern)

```
┌──────────────────────────────────────────────┐
│ [👤] John Doe                       [📞] [↗] │
│      June, 2025                              │
│                                              │
│  Follow-ups                                  │
│  Interested in a 3BHK condo        🕐 2:30pm │
└──────────────────────────────────────────────┘
```

- White card, 16px radius, 16px padding, `shadow.sm`.
- Action icons (call, mail, edit) are 36px circular ghost buttons on the right.

### 6.7 Stat tile
Small white card, 20px radius, 24px padding:
- Label (subtitle1, text.secondary, 14px)
- Value (h3, 32px, bold)
- Delta (caption, green/red, with arrow)

### 6.8 Chips
- Status chip: pill, 24px tall, 12px horizontal padding, 12px medium text, tinted bg + saturated text from §2.
- Filter chip: pill, outlined when inactive, filled `text.primary` (black) when active — selected chips invert.

### 6.9 Avatar
- Always circular. 32 / 40 / 48 / 64 / 96 px sizes only.
- Group: overlap by -8px. Cap at 4 visible + "+N" chip.

### 6.10 Tables / DataGrid (MUI X)
- No vertical borders. Row dividers in `divider` color.
- Row height 56px. Header height 48px, `background.subtle` fill, no shadow.
- Selected row: `primary.main` at 6% opacity background.

### 6.11 Charts (MUI X Charts)
- Use the accent palette from §2. Bar charts default to the dual orange/blue pairing seen in references.
- No gridlines on the X axis. Y axis gridlines at `divider` color.
- Tooltips: white card, 12px radius, `shadow.md`, no border.

---

## 7. Iconography

- **Library:** `lucide-react` (default) + `@mui/icons-material` (only when Lucide lacks an equivalent).
- Stroke width: **1.5**.
- Size: 16 (inline), 18 (input), 20 (button), 24 (nav).
- Color: inherits from parent — `text.secondary` by default, `text.primary` on hover/active.

---

## 8. Motion

Subtle. Functional.

| Interaction | Duration | Easing |
|---|---|---|
| Hover / focus | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Card lift / dropdown | 200ms | same |
| Page transition | 240ms | same |
| Modal / drawer | 280ms | same |

Never animate color hue. Animate opacity, transform, shadow only. No bouncy springs.

---

## 9. Dark Mode

Toggle via MUI `ThemeProvider` with two palettes. Every component MUST be tested in both.

- Surfaces step *up* in lightness, not down: `default #0B0B14` → `paper #15151F` → `subtle #1B1B27`.
- Status tints become 12% opacity overlays of the saturated chip color.
- Shadows become inset highlights on the top edge instead of drop shadows.

---

## 10. Responsive Behavior

Breakpoints (MUI defaults):
- `xs` 0 / `sm` 600 / `md` 900 / `lg` 1200 / `xl` 1536

Rules:
- **< md:** side nav collapses to a drawer behind a hamburger. Top bar search becomes an icon that expands.
- **< md:** cards stack vertically, full width minus 16px margins. Card padding shrinks 24 → 20.
- **< sm:** aside columns drop below main content.
- Touch targets: **minimum 44×44px** on any viewport below `md`.

---

## 11. Accessibility (non-negotiable)

- All text meets WCAG AA contrast against its background. Verify especially on tinted status cards.
- Focus rings are visible — 2px `primary.main` outline with 2px offset on every interactive element. Never remove `:focus-visible`.
- Every icon-only button has an `aria-label`.
- Status is never communicated by color alone — always pair with text or icon.
- Form inputs always have a visible label (no placeholder-as-label).

---

## 12. Theme File Structure

Create one source of truth at `apps/web/src/theme/index.ts`:

```
theme/
├── index.ts          # createTheme() — exports light + dark
├── palette.ts        # all color tokens
├── typography.ts     # Outfit | Urbanist + scale
├── shadows.ts        # custom shadow array
├── components.ts     # MuiButton, MuiPaper, MuiTextField overrides
└── tokens.ts         # spacing aliases, radii constants
```

Component-local styling: **CSS Modules** (`Component.module.css`) for layout-only concerns. All color, spacing, radius, shadow values come from the theme via `sx` or `styled()` — never hardcoded in CSS Modules.

---

## 13. Don'ts

- ❌ No Tailwind, no shadcn, no Mantine.
- ❌ No hardcoded hex values outside `palette.ts`.
- ❌ No square corners on interactive elements.
- ❌ No `border: 1px solid <color>` to separate cards — use shadow or tint.
- ❌ No uppercase buttons.
- ❌ No more than one filled primary button per visible viewport.
- ❌ No emoji as UI iconography (Lucide only).
- ❌ No fixed pixel font sizes in components — use `theme.typography.*` variants.

---

## 14. Reference Patterns (when to use what)

| Goal | Pattern |
|---|---|
| "Show me one entity's status at a glance" | §6.5 Status card |
| "List of tasks I need to act on" | §6.6 List row |
| "Headline number with trend" | §6.7 Stat tile |
| "Filter a long list" | §6.8 Filter chips above a DataGrid |
| "Primary CTA in a flow" | Dark primary button (§6.3) |
| "Secondary action on a card" | Circular ghost icon button (§6.3) |
| "Categorical data in a chart" | Accent palette (§2) |

---

## 15. Component States (mandatory for every interactive element)

Every interactive primitive MUST define visuals for all six states. If a state is intentionally identical to default, say so explicitly — never leave it undefined.

### 15.1 State matrix

| State | Buttons (filled) | Buttons (ghost/icon) | Inputs | Nav item | Chip (filter) | Card (interactive) |
|---|---|---|---|---|---|---|
| **Default** | bg = primary, text = white | bg = subtle, icon = text.secondary | bg = subtle, no border | bg = transparent, text = text.secondary | outlined, text = text.primary | shadow.sm |
| **Hover** | bg darkens 8% | bg darkens one step | bg darkens 4% | bg = subtle | bg = subtle | shadow.md, translateY(-1px) |
| **Focus-visible** | + 2px primary ring, 2px offset | same | + 2px primary ring (replaces bg darken) | + 2px primary ring | same | + 2px primary ring |
| **Active (pressed)** | bg darkens 12%, scale(0.98) | scale(0.96) | n/a | n/a | scale(0.97) | scale(0.99) |
| **Selected** | n/a | n/a | n/a | bg = `text.primary` (black pill), text/icon = white | bg = `text.primary`, text = white | 2px primary border, no shadow change |
| **Disabled** | bg = `divider`, text = `text.secondary`, no shadow | opacity 0.4 | opacity 0.5, no interaction | opacity 0.4 | opacity 0.4 | opacity 0.6, no hover |
| **Loading** | spinner replaces text, bg unchanged, width preserved | spinner replaces icon | trailing spinner inside pill | n/a | n/a | skeleton shimmer (see §16) |

### 15.2 Focus rings — universal rule
2px solid `primary.main`, 2px offset, 999px (or matching shape) radius. Never replaced. Never removed. Applied via `:focus-visible`, not `:focus`.

### 15.3 Transition spec
All state changes use `transition: background-color 150ms, box-shadow 150ms, transform 150ms, opacity 150ms; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 16. Screen-level states

Every screen MUST handle four conditions. Specify all four when building any view.

| State | Treatment |
|---|---|
| **Loading** | Skeleton blocks matching final layout. Same radii (20px cards, 999px pills). Color = `background.subtle`. Shimmer animation: linear gradient, 1.4s loop, left→right. **No spinners at page level.** |
| **Empty** | Centered illustration (200×200), `h4` title, `body2` description, one primary action. Vertical padding 64px. |
| **Error** | Same layout as empty, with critical-tinted icon and `text.primary` title "Something went wrong". Two actions: retry (primary), report (ghost). |
| **Partial / stale** | Banner above content, 12px radius, info-tinted, dismissible. Never blocks interaction. |

---

## 17. Precise measurements (reference tables)

Where ASCII anatomy in §6 is ambiguous, these tables are authoritative.

### 17.1 Buttons
| Property | Primary | Secondary | Ghost icon | FAB-style expand |
|---|---|---|---|---|
| Height | 44px | 44px | 40px | 36px |
| Min width | 88px | 88px | 40px | 36px |
| Horizontal padding | 24px | 24px | 0 (icon-only) | 0 |
| Icon size | 18px | 18px | 20px | 16px |
| Icon-to-text gap | 8px | 8px | n/a | n/a |
| Font | button (14/20 medium) | same | n/a | n/a |

### 17.2 Inputs
| Property | Value |
|---|---|
| Height | 44px |
| Horizontal padding | 20px |
| Leading icon size | 18px |
| Leading icon offset from left edge | 16px |
| Icon-to-text gap | 12px |
| Label gap (when external) | 8px above input |
| Helper text gap | 6px below input |

### 17.3 Cards
| Property | Default | Hero | Compact |
|---|---|---|---|
| Padding | 24px | 32px | 16px |
| Radius | 20px | 24px | 16px |
| Title-to-body gap | 16px | 20px | 12px |
| Body-to-action gap | 24px | 32px | 16px |
| Internal section gap | 20px | 24px | 12px |

### 17.4 Status card (§6.5)
| Property | Value |
|---|---|
| Padding | 20px |
| Radius | 20px |
| Avatar size | 40px |
| Avatar-to-name gap | 12px |
| Name-to-role gap | 4px |
| Top row to bottom row gap | 24px |
| Chip height | 24px |
| Expand button | 32px circular, top-right corner, 16px inset |

### 17.5 List row (§6.6)
| Property | Value |
|---|---|
| Padding | 16px |
| Radius | 16px |
| Avatar size | 44px |
| Avatar-to-text gap | 12px |
| Primary-to-secondary text gap | 2px |
| Header-to-body gap | 16px |
| Action icon button | 36px circular, 8px between adjacent |

### 17.6 Stat tile (§6.7)
| Property | Value |
|---|---|
| Padding | 24px |
| Radius | 20px |
| Label-to-value gap | 8px |
| Value-to-delta gap | 8px |
| Min height | 120px |

### 17.7 Chips
| Property | Status chip | Filter chip |
|---|---|---|
| Height | 24px | 32px |
| Horizontal padding | 12px | 16px |
| Radius | 999px | 999px |
| Icon size (if present) | 12px | 16px |
| Icon-to-text gap | 6px | 8px |
| Font | caption (12/16 medium) | body2 (13/20 medium) |

### 17.8 Nav item
| Property | Value |
|---|---|
| Height | 44px |
| Horizontal padding | 16px |
| Icon size | 20px |
| Icon-to-label gap | 12px |
| Radius (selected pill) | 999px |
| Group label (e.g. "Productivity") | caption, text.secondary, 12px top padding, 8px bottom |

---

## 18. Naming conventions

Components produced from this spec MUST use these names. No synonyms, no creative renames.

### 18.1 Primitives — use MUI directly
Do not create wrappers for these. Style them via `theme.components.*` overrides:

`Button` · `IconButton` · `TextField` (with `InputProps` for search/icon variants) · `Chip` · `Avatar` · `AvatarGroup` · `Paper` (for cards) · `Skeleton` · `Tooltip` · `Menu` · `Dialog` · `Drawer`.

The only acceptable reason to wrap an MUI primitive is to encode a *semantic variant* not expressible via theme overrides (e.g. `StatusChip` below, because `tone` maps to a tinted bg + saturated text pair that MUI's `color` prop can't represent cleanly).

### 18.2 Allowed wrappers and composite patterns
| Spec section | Component name | Why it exists |
|---|---|---|
| §2 status colors | `StatusChip` | Maps `tone` → tinted bg + saturated text; thin wrapper over `Chip`. |
| §6.1 Page shell | `AppShell`, `TopBar`, `SideNav`, `NavItem`, `NavGroup` | Layout composition; not in MUI. |
| §6.5 Status card | `StatusCard` (prop: `tone: 'active' \| 'pending' \| 'critical' \| 'info' \| 'neutral'`) | Composite of `Paper` + `Avatar` + `StatusChip` + `IconButton`. |
| §6.6 List row | `ListRow` | Composite of `Paper` + content slots + action icons. |
| §6.7 Stat tile | `StatTile` | Composite of `Paper` + label + value + delta. |
| §6.10 DataGrid wrapper | `DataTable` | Pre-configured MUI X `DataGrid` with our row heights, header fill, no-border styling. |
| §6.11 Chart wrappers | `BarChart`, `LineChart`, `DonutChart` | Pre-configured MUI X Charts with our accent palette, tooltip, gridline rules. |

### 18.3 Prop conventions
- Tone/variant always: `tone` (semantic — `active`, `critical`) or `variant` (structural — `filled`, `ghost`).
- Size always: `size: 'sm' | 'md' | 'lg'`. Default `md`.
- Boolean props are positive: `loading`, `selected`, `disabled` — never `notLoading`.
- Click handlers: `onClick`, `onSelect`, `onDismiss`. Never `handleClick`.

### 18.4 File layout

```
src/
├── theme/                  # §12 — all primitive styling lives here
├── components/
│   ├── patterns/           # StatusCard, ListRow, StatTile, StatusChip
│   └── layout/             # AppShell, TopBar, SideNav, NavItem, NavGroup
└── pages/                  # screen compositions (import MUI + patterns)
```

There is no `primitives/` folder. MUI is the primitive layer.

---

## 19. Composition rules

1. **Card nesting:** maximum one level. A `Card` may contain `StatusCard`, `ListRow`, `StatTile`. A `StatusCard` MUST NOT contain another card.
2. **One hero per page.** Only one `HeroCard` or `h1` per screen. Subsequent sections start at `h3`.
3. **Action density:** maximum 3 visible action buttons per card (excluding the expand/overflow affordance). Overflow goes into a `…` menu.
4. **Chip clusters:** maximum 6 visible chips in a row. Beyond that, wrap or scroll horizontally with a fade mask.
5. **Tinted surfaces don't stack.** A tinted `StatusCard` (mint, peach, etc.) MUST sit on a neutral `background.default` or white `background.paper`. Never place a tinted card on another tinted card.
6. **Shadows don't stack.** A shadowed card MUST sit on a flat surface. Never `shadow.md` inside `shadow.lg`.
7. **Status chips appear inside status cards or at the right edge of list rows.** Never floating in body text.

---

## 20. How to use this spec

When building a new component or screen, the agent MUST:

1. Identify the closest pattern in §6 — name and tone.
2. Pull exact dimensions from §17.
3. Implement all six states from §15.1 + focus rule §15.2.
4. Handle all four screen states from §16 if it's a screen.
5. Use the name from §18.2 and props from §18.3.
6. Verify composition rules in §19 before nesting.
7. If a needed pattern doesn't exist in §6, do not invent one — escalate and request a spec extension.

---

End of document. When in doubt, default to **more whitespace, softer corners, lighter shadows**.
