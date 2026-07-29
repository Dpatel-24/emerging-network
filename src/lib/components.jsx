import { useState } from 'react';
import { color, font, fontSize, letterSpacing, spacing } from './tokens.js';

// ─── Shared UI primitives ───────────────────────────────────────────────────
// Each of these replaces a pattern the audit found copy-pasted 2+ times
// across FundPanel / InvestorPanel / PartnerPanel / cards. No visual change —
// same markup, same styles, just written once.

// Replaces the "eyebrow" uppercase label div duplicated 12x in the audit
// (App.jsx:231,238,245,256,278,318,324,334,360,390,396,720).
export function EyebrowLabel({ children, marginBottom = spacing[8], style = {} }) {
  return (
    <div style={{
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.widest,
      textTransform: 'uppercase',
      color: color.mutedSoft,
      marginBottom,
      ...style,
    }}>
      {children}
    </div>
  );
}

// Replaces the identical "×" close button duplicated 3x in the audit
// (App.jsx:223,307,382).
export function CloseButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 22, lineHeight: 1, color: color.ink, padding: 0, outline: 'none',
    }}>×</button>
  );
}

// Replaces the 8 near-identical action-link `<a>` tags duplicated across
// FundPanel/InvestorPanel/PartnerPanel (App.jsx:287-289,366-367,401-403).
// variant: 'solid' (website), 'outline' (linkedin), 'muted' (email)
export function LinkButton({ href, variant = 'outline', children }) {
  const variantStyle = {
    solid:   { background: color.ink, color: color.cream, border: 'none' },
    outline: { background: 'transparent', color: color.ink, border: `1px solid ${color.ink}` },
    muted:   { background: 'transparent', color: color.mutedLink, border: `1px solid ${color.borderMuted}` },
  }[variant];
  return (
    <a href={href} target={variant !== 'muted' ? '_blank' : undefined}
      rel={variant !== 'muted' ? 'noopener noreferrer' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: spacing[8],
        padding: '10px 18px',
        fontSize: fontSize.sm, letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase', textDecoration: 'none', width: 'fit-content',
        ...variantStyle,
      }}>
      {children}
    </a>
  );
}

// Ensures a URL has a protocol. Was duplicated independently in PartnerPanel
// (App.jsx:377) and PulseTab (App.jsx:684) — now a single utility.
export function ensureHttp(s) {
  return s ? (s.startsWith('http') ? s : `https://${s}`) : '';
}

// Replaces the [hov,setHov] state + hover-style branching duplicated 3x
// across FundCard/InvestorCard/PartnerCard (App.jsx:412,441,474).
export function useHoverCard() {
  const [hov, setHov] = useState(false);
  const hoverProps = { onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false) };
  const cardStyle = {
    padding: '20px 22px', cursor: 'pointer',
    background: hov ? color.ink : color.cream,
    color: hov ? color.cream : color.ink,
    transition: 'all 0.12s', height: '100%',
  };
  return { hov, hoverProps, cardStyle };
}

// Replaces the 2-column key/value grid duplicated in FundPanel (235-242)
// and InvestorPanel (357-364).
export function KeyValueGrid({ pairs }) {
  const filtered = pairs.filter(([, v]) => v);
  if (!filtered.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: spacing[20] }}>
      {filtered.map(([label, value]) => (
        <div key={label}>
          <EyebrowLabel marginBottom={4}>{label}</EyebrowLabel>
          <div style={{ fontSize: fontSize.basemdPlus }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// Panel section header row (used at top of every slide panel).
export function PanelHeader({ label, color: labelColor = color.muted, onClose }) {
  return (
    <div style={{
      padding: '16px 28px', borderBottom: `1px solid ${color.ink}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{
        fontSize: fontSize.sm, letterSpacing: letterSpacing.wider,
        textTransform: 'uppercase', color: labelColor, fontWeight: 500,
      }}>{label}</span>
      <CloseButton onClick={onClose} />
    </div>
  );
}

export { font };
