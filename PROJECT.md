# Emerging Networks — Project Notes

## Decisions log

### 2026-07-29 — Token & component system extraction

**What changed:** Introduced `src/lib/tokens.js` (colors, type scale, letter-spacing
scale, spacing scale, layout constants, radius) and `src/lib/components.jsx`
(shared UI primitives: `EyebrowLabel`, `CloseButton`, `LinkButton`, `PanelHeader`,
`KeyValueGrid`, `useHoverCard`, `ensureHttp`). `src/App.jsx` was then edited
section by section to reference these instead of inline hex/px/font literals.

**Why:** A prior read-only audit of `src/App.jsx` (1,428 lines, all-inline-styles,
no separation of data/UI) found ~34 distinct hardcoded hex colors used 250+
times, 19 raw fontSize values, 8 raw letterSpacing values, and several
JSX patterns copy-pasted 3–12 times verbatim (panel headers, close buttons,
action-link buttons, card hover state, the "eyebrow" uppercase label, `ensureHttp`
defined twice). This pass converts that duplication into single sources of
truth without changing any visual output or behavior.

**What was extracted:**
- Colors → `color.*` in tokens.js, grouped by role (ink, cream, bgSubtle,
  border variants, muted variants, brandRed, statusLoading/Live, plus a few
  named one-offs like `mutedFooterStat`/`dispatchBody`/`borderFaint`/`hoverText`
  that the audit found used only once or twice but which needed a home so no
  raw hex remained in the app).
- Semantic region/type/partner color maps (`REGION_COLORS`, `TYPE_COLORS`,
  `PARTNER_COLORS`) — these were already well-structured; they now live in
  tokens.js as `regionColors`/`typeColors`/`partnerColors` and are aliased
  back to their original names in App.jsx so the map/filter logic didn't
  need to change.
- Type scale → `fontSize.*` (xxs…display4), `letterSpacing.*` (tight…xxwide),
  `font.mono`/`font.display` for the two font-family strings.
- Spacing scale → `spacing.*`, layout constants → `layout.*`
  (`headerHeight`, `panelWidth`, `mapViewBox`, etc.)
- Duplicated JSX → `EyebrowLabel`, `CloseButton`, `LinkButton` (variant:
  solid/outline/muted), `PanelHeader`, `KeyValueGrid`, `useHoverCard()`
  (replaces the `[hov,setHov]` + hover-style branching that was copy-pasted
  in `FundCard`/`InvestorCard`/`PartnerCard`), and a single `ensureHttp`
  (previously defined independently in `PartnerPanel` and `PulseTab`).

**What was deliberately NOT touched:** the entire `MapTab` component, the
`FIPS_REGION` table, `REGION_LABEL` centroids, `decodeTopojson`, `fetchAll`,
`api/airtable.js`, and the filter-predicate logic inside `CapitalTab` — all
flagged "do not touch" by the prior audit. No values were swapped inside
`MapTab` even where a token would have applied cleanly, to avoid any risk of
altering the geography/map rendering behavior.

**Rule going forward:** no raw hex values, raw pixel/fontSize/letterSpacing
numbers, or copy-pasted JSX blocks anywhere in the app. If a new value is
needed, add it to `src/lib/tokens.js` first — never inline it. If a UI
pattern is used more than once, it belongs in `src/lib/components.jsx`.

**Next planned pass:** build out a real Partners section (individual
partners — accounting, legal, banking, recruiting — not VC fund partners),
with placeholder entries where data is missing. Not started in this pass.
