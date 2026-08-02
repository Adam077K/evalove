---
name: beamix-brand-quality-bar
last_updated: 2026-05-17
description: "Beamix billion-dollar-feel design rules: color palette v4.0 (blue #3370FF accent), typography system (InterDisplay + Inter + Fraunces + Geist Mono), spacing, animation budget, and empty-state requirements. Use before any design implementation or design review."
tags: [design, beamix-specific, frontend, brand]
source: beamix-authored 2026-05-16
risk: low
---

# Beamix Brand Quality Bar

## Quick reference

> Stripe / Linear / Apple / Anthropic-grade. Every space, button, letter intentional. If it would embarrass at YC demo day, it ships at half quality.

## When to use

- Before implementing any UI component or page
- Reviewing a design deliverable from product-designer or design-critic
- Checking whether a Framer marketing change or Next.js dashboard update is on-brand
- Settling color, font, or spacing questions without asking Adam

## When NOT to use

- For agent-to-agent communication design (this covers user-facing product and marketing surfaces only)

## The quality bar

Every pixel, space, button, and letter must be intentional. The reference quality is Stripe/Linear/Apple/Anthropic. Ask: "Would this ship on stripe.com?" If not, it's not done.

Specific failure patterns to eliminate:
- Placeholder color ("I'll fix the blue later")
- Generic shadows (box-shadow: 0 2px 4px rgba(0,0,0,0.1) is not a design decision)
- Inconsistent spacing (pick from the 8pt grid and stay there)
- Mixing font weights without a reason
- Animations that run on every page load without adding meaning

## Color palette (v4.0 — locked)

### Use these

| Token | Hex | When to use |
|-------|-----|-------------|
| Background | `#FFFFFF` | Primary page background |
| Surface Alt | `#F7F7F7` | Section backgrounds, alternating panels |
| Primary Text | `#0A0A0A` | All headings and body copy |
| Muted Text | `#6B7280` | Descriptions, captions, secondary labels |
| Card Border | `#E5E7EB` | Card and input borders |
| **Primary Accent** | **`#3370FF`** | CTAs, links, logo mark, active states, charts |
| Secondary CTA | `#0A0A0A` | Secondary action buttons |

### Score colors (data viz only — never buttons or links)

| Level | Hex | Range |
|-------|-----|-------|
| Excellent | `#06B6D4` | 75–100 |
| Good | `#10B981` | 50–74 |
| Fair | `#F59E0B` | 25–49 |
| Critical | `#EF4444` | 0–24 |

### Dark mode accent

| Token | Hex |
|-------|-----|
| Primary Accent (dark) | `#5A8FFF` |

### Retired — do not use

```
Navy #023C65
Yale Blue #25426A
Blue Slate #536D84
Old orange #F97316
Old indigo #6366F1
Old orange accent #FF3C00
Old background #FAFAF9
Cyan as accent #06B6D4 (score use only — never as CTA or link)
```

Any PR using these colors is returned BLOCK by design-critic.

## Typography

| Font | Use | Do NOT use for |
|------|-----|---------------|
| `InterDisplay-Medium` | All headings (48–72px), tight tracking -2px | Body copy, UI labels |
| `Inter` | Body (16–20px), UI labels, captions | Headings |
| `Fraunces` | Dark sections + testimonial carousel only, white text | Any light-background section |
| `Geist Mono` | Code blocks, scan data, JSON output | Regular copy |

### Type scale

| Level | Size | Weight | Line Height |
|-------|------|--------|------------|
| Hero / Display | 56–72px | InterDisplay-Medium | ~1.05 |
| H1 | ~40px | InterDisplay-Medium | 1.1 |
| H2 | ~28px | Inter 600 | 1.2 |
| H3 | ~20px | Inter 600 | 1.3 |
| Body | ~16px | Inter 400 | 1.6 |
| UI Label / Caption | ~13px | Inter 500 | 1.4 |
| Section Eyebrow | 12px | Inter 600 uppercase | — |

**Capitalization:** H1 Title Case. H2–H6 Sentence case.
**Reading width:** Body 560px max. Headlines 640px max.

**Retired fonts (never use):** Montserrat, Outfit, Source Serif, DM Serif, PT Sans, Plus Jakarta Sans, Figtree.

## Buttons

| Type | Shape | Background | Text |
|------|-------|-----------|------|
| Primary marketing | Pill (999px radius) | `#3370FF` | `#FFFFFF` |
| Secondary marketing | Pill (999px radius) | `#0A0A0A` | `#FFFFFF` |
| Product utility | Rounded-lg (8px radius) | Context | Context |

Primary and secondary marketing buttons never have a border — fill only.

## Spacing system (8pt grid)

```
4px   — icon internal padding, tight inline gaps
8px   — component internal padding (card headers, input padding)
16px  — standard component padding, row gaps in forms
24px  — section internal spacing
32px  — between components in a section
48px  — between page sections (mobile)
64px  — between page sections (desktop)
96px  — hero to first section
```

Deviations from the 8pt grid require an explicit reason in the PR description.

## Animation budget

Not every page gets motion. Motion must add meaning.

| Tier | Budget | When to use |
|------|--------|-------------|
| Tier 1 | One signature animation | Hero section, onboarding completion |
| Tier 2 | Subtle transitions only | Page transitions, state changes |
| Tier 3 | No animation | Data tables, dense dashboards |

Animation rules:
- Duration: 200–400ms for UI interactions. 600–1200ms for hero/intro animations.
- Easing: `ease-out` for elements entering. `ease-in` for elements leaving.
- No animation that repeats on every page load without user trigger (except hero — one per session)
- Respect `prefers-reduced-motion` — all animations must have a static fallback

## Empty states

Every list, table, or data view must have an intentional empty state. No blank white space.

Empty state requirements:
- Illustration or icon (on-brand, not stock)
- Headline: specific to what's missing ("No scans yet" not "No data")
- Action: one clear CTA that resolves the empty state
- Copy: voice canon compliant (no buzzwords, direct, warm)

```tsx
// Example empty state component
<EmptyState
  icon={<ScanIcon />}
  headline="No scans yet"
  body="Your first GEO scan shows where AI search engines rank your business."
  action={<Button variant="primary">Start your first scan</Button>}
/>
```

## See also

- `design-taste-frontend` — [[design-taste-frontend]]
- `high-end-visual-design` — [[high-end-visual-design]]
- `minimalist-ui` — [[minimalist-ui]]
- `wcag-audit-patterns` — [[wcag-audit-patterns]]

## Anti-patterns

- Using orange, navy, or cyan as accent colors (all retired)
- Using `#3370FF` for data visualization (accent is for actions, not data)
- Using Fraunces on light backgrounds (testimonial / dark section only)
- Generic drop shadows without a specific reason
- Animation on every render without `prefers-reduced-motion` check
- Empty white space where an empty state should be
- Body copy wider than 560px (hurts readability)
- Mixing font weights in a single heading (pick one weight per level)
