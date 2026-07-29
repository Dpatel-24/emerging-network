// ─── Design tokens ──────────────────────────────────────────────────────────
// Extracted from the audit of src/App.jsx. Every value here already existed
// in the codebase — nothing new was invented. Do not add a value here unless
// it is actually needed by a component; do not inline a raw value elsewhere
// once it has an equivalent token here.

// ── Color ───────────────────────────────────────────────────────────────────
// Grouped by role, not by hue. Matches the 5 non-semantic groups identified
// in the audit (ink, bg, border, muted-text, brand-red), plus the semantic
// maps (region/type/partner) which were already correctly structured and are
// carried over unchanged.
export const color = {
  ink:        '#1a1a1a', // primary text / dark surfaces
  cream:      '#faf6f0', // page background
  bgSubtle:   '#f0ebe3', // secondary surface (filter bars, side panels)
  bgFaint:    '#f5f0e8', // map background
  border:     '#d4cfc7', // primary hairline border
  borderSoft: '#e8e3db', // lighter divider (cards, list rows)
  borderMap:  '#ddd8d0', // map container border
  borderMuted:'#ccc',    // muted input/link border
  borderFaint:'#eee',    // mobile nav row divider (one-off, distinct from borderSoft)
  muted:      '#888',    // secondary text
  mutedSoft:  '#999',    // eyebrow label text
  mutedLink:  '#555',    // muted email link text
  mutedFooterStat: '#666', // footer stat label (dark background context)
  dispatchBody: '#333',  // dispatch body text color
  hoverText:  '#aaa',    // card label text color when card is hovered (dark bg)
  hoverRow:   '#f0ebe3', // list-row hover background (light)
  hoverRowAlt:'#e5dfd6', // list-row hover background (map side panel)
  white:      '#fff',
  brandRed:   '#c8302a', // brand accent (tagline, CTA, clear-filters)
  statusLoading: '#f59e0b', // header "fetching" indicator
  statusLive:    '#22c55e', // header "live" indicator
};

// Semantic maps — unchanged from App.jsx, relocated here as the single
// source of truth. Region label coordinates and FIPS mapping stay in App.jsx
// (map/geography logic — do not touch).
export const regionColors = {
  'West':        '#64748b',
  'North West':  '#22c55e',
  'South West':  '#f97316',
  'Mid-West':    '#eab308',
  'South East':  '#f59e0b',
  'Mid-Atlantic':'#06b6d4',
  'North East':  '#7c3aed',
  'Gulf South':  '#ef4444',
};

export const typeColors = {
  'Venture Fund':    '#c8302a',
  'Accelerator':     '#1d4ed8',
  'Economic Dev':    '#15803d',
  'Government':      '#7c3aed',
  'University Fund': '#b45309',
  'Family Office':   '#0e7490',
  'Angel Group':     '#be185d',
};

export const partnerColors = {
  'Legal':              '#c8302a',
  'Finance & CFO':      '#15803d',
  'Brand & Creative':   '#1d4ed8',
  'PR & Comms':         '#b45309',
  'Recruiting':         '#7c3aed',
  'Accounting':         '#0e7490',
  'Coworking':          '#be185d',
  'Events & Community': '#d97706',
  'Other':              '#888',
};

// ── Typography ──────────────────────────────────────────────────────────────
export const font = {
  mono:    '"Inter",sans-serif',
  display: '"Inter",sans-serif',
};

// Collapses the 19 raw fontSize values found in the audit into named steps.
// Each step maps to the closest existing value(s) in use; call sites that
// used a slightly different number (e.g. 13.5) keep that exact step since it
// was a deliberate size, not noise.
export const fontSize = {
  xxs:  8,
  xs:   9,
  xs5:  9.5,
  sm:   10,
  smd:  11,
  base: 12,
  basemd: 13,
  basemdPlus: 13.5,
  md:   14,
  mdlg: 15,
  lg:   16,
  lg2:  17,
  xl:   18,
  xxl:  20,
  display1: 22,
  display2: 24,
  display3: 28,
  display4: 36,
};

// Collapses the 8 raw letterSpacing values into the same set (kept 1:1 since
// each was already a deliberate, distinct step used consistently).
export const letterSpacing = {
  tight:  0.5,
  snug:   1,
  normal: 1.5,
  wide:   2,
  wider:  2.5,
  widest: 3,
  xwide:  4,
  xxwide: 5,
};

// ── Spacing ─────────────────────────────────────────────────────────────────
// The codebase never used a strict 4/8 grid, but padding pairs repeat enough
// to name. These are the exact recurring pairs found in the audit.
export const spacing = {
  0: 0,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
};

// ── Layout constants ────────────────────────────────────────────────────────
export const layout = {
  headerHeight: 74,
  panelWidth: 440,
  panelWidthTablet: 400,
  panelWidthMobile: '100vw',
  mapViewBox: '0 0 960 600',
  mapSideWidth: 320,
  mapSideWidthTablet: 260,
};

// ── Radius ──────────────────────────────────────────────────────────────────
// The codebase uses square corners everywhere except avatar circles.
export const radius = {
  none: 0,
  circle: '50%',
};
