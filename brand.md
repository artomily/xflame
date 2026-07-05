# Brand — xflame

Stellar DeFi toolkit — on-chain notes, testnet faucet, send XLM. Friendly, mobile-first, fronted by two mascots.

_Palette pivoted from orange "Flame Protocol" to "Blue Flame" on 2026-07-06 to match the mascot art. Update by re-running `/brand-design`._

## Mascots

| File | Character | Use |
|---|---|---|
| `frontend/public/ame.png` | **Ame** — cute blue flame spirit (name from xfl-**AME**) | Logo mark in header, faucet heading, loading indicator (`ame-bob` class) |
| `frontend/public/dino.png` | Ame's dino buddy — blue baby dino with a blue-flame tail | Hero / empty states (`ame-float` class), success cards, send heading |

Both PNGs were chroma-keyed (baked checkerboard removed via border flood-fill) — safe on any background.

## Palette — Blue Flame

**Vibe:** friendly · playful · blue fire · trustworthy
**Category:** defi
**Mood:** cool

### Seeds

| Role | OKLCH | Hex |
|---|---|---|
| brand | `oklch(0.55 0.19 255)` | `#006EDC` |
| brand-soft | `oklch(0.72 0.13 250)` | `#60AAF3` |
| canvas | `oklch(0.975 0.01 240)` | `#F1F8FD` |
| surface | `oklch(1 0 0)` | `#FFFFFF` |
| ink | `oklch(0.24 0.035 255)` | `#142030` |

### Tailwind v4 theme (applied to `src/index.css`)

```css
@theme {
  --color-brand:         oklch(0.55 0.19 255);
  --color-brand-soft:    oklch(0.72 0.13 250);
  --color-brand-fg:      oklch(0.99 0 0);
  --color-canvas:        oklch(0.975 0.01 240);
  --color-surface:       oklch(1 0 0);
  --color-surface-mid:   oklch(0.945 0.015 240);
  --color-ink:           oklch(0.24 0.035 255);
  --color-ink-muted:     oklch(0.50 0.025 250);
  --color-edge:          oklch(0.885 0.015 240);
  --color-success:       oklch(0.45 0.18 150);
  --color-danger:        oklch(0.55 0.22 25);
}
```

### Contrast check (WCAG, measured)

| Pair | Ratio |
|---|---|
| ink / canvas | 15.3:1 ✓ |
| ink-muted / canvas | 5.6:1 ✓ |
| brand-fg / brand | 4.8:1 ✓ |
| ink / surface | 16.4:1 ✓ |

## Layout — mobile-first

- Fixed bottom tab bar on mobile (`sm:hidden`), pill nav in header on desktop.
- `env(safe-area-inset-bottom)` padding on the bottom nav; content wrapper clears it with `pb-28`.
- Inputs forced to 16px under 640px so iOS Safari doesn't zoom on focus.
- Cards: `rounded-xl border border-edge bg-surface`; inputs sit on `bg-canvas` inside cards.

## Typography

- **Display + body:** system-ui / Inter (no custom font yet — run `/brand-design` to wire a Google Font)
- **Mono (addresses, amounts, code):** `ui-monospace`, SF Mono, Menlo

Use `font-mono tabular-nums` on all prices, balances, and wallet addresses.

### Type scale

| Role | Class |
|---|---|
| Hero title | `text-2xl font-bold tracking-tight` |
| Page title | `text-xl font-bold tracking-tight` |
| Section label | `text-xs font-medium uppercase tracking-wider text-ink-muted` |
| Body | `text-sm text-ink` |
| Caption / meta | `text-xs text-ink-muted` |
| Mono value | `font-mono text-lg font-semibold tabular-nums` |

## Tone and voice

**Words to use:** direct, specific, number-forward. Say what the action does, not how it feels. "Fund account" not "unlock your potential". Contractions are fine. Second person preferred. Mascots add warmth visually — the copy stays plain.

**Words to avoid:** "revolutionary", "game-changing", "unleash", "supercharge", "unlock", "seamless". No exclamation marks outside genuine success moments.

**Voice example:** "Fund your testnet account with 10,000 XLM. No sign-up. No wait."

## Usage dos and don'ts

**Do:**
- Use `bg-canvas`, `bg-surface`, `text-ink`, `border-edge`, `bg-brand` everywhere. Never hardcode hex.
- `font-mono tabular-nums` on all balances, amounts, and addresses.
- Keep focus rings: `focus-visible:ring-2 focus-visible:ring-brand`.
- Test keyboard navigation (Tab → Enter → Esc for overlays).
- Reserve `ame-float` for one hero element per screen; `ame-bob` for small loading marks.

**Don't:**
- Hardcode `#006EDC` or any hex in component files.
- Use `transition: all` — specify `transition-colors` or `transition-opacity`.
- Use brand blue for error states — use `text-danger` / `bg-danger`.
- Add decorative gradients to form fields or cards.
- Scatter mascots on every surface — max one large mascot per screen.

---

_Last updated: 2026-07-06 · Palette: Blue Flame · Stack: Vite + React + Tailwind v4_
