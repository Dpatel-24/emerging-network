import { useState, useEffect } from 'react';
import { color, font, fontSize, letterSpacing, spacing } from './tokens.js';

// Resets native button chrome so a <button> can be styled identically to the
// clickable <div> patterns it replaces, while staying keyboard-operable
// (focusable, Enter/Space activate it, shows up in the tab order).
export const buttonReset = {
  font: 'inherit', textAlign: 'left', width: '100%', display: 'block',
};

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
export function CloseButton({ onClick, label = 'Close' }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 22, lineHeight: 1, color: color.ink, padding: 0,
    }}>×</button>
  );
}

// Closes an open panel/modal on Escape. Used by SlidePanel and the contact
// modal so keyboard users aren't trapped once one is open.
export function useEscapeToClose(onClose) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
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
  const hoverProps = {
    onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false),
    onFocus: () => setHov(true), onBlur: () => setHov(false),
  };
  const cardStyle = {
    ...buttonReset,
    padding: '20px 22px', cursor: 'pointer', border: 'none',
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

// Placeholder shown in a Partners category with zero real entries. Same
// padding/height as PartnerCard so the grid doesn't visually break when a
// category is empty, but styled as an open slot rather than a filled one:
// dashed border, muted ink instead of the category accent color, no hover
// invert (nothing to click through to).
export function OpenSeatCard({ category, onRequestReferral }) {
  return (
    <div style={{
      padding: '20px 22px', height: '100%',
      border: `1px dashed ${color.muted}`, background: 'transparent',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontSize: fontSize.sm, letterSpacing: letterSpacing.wide, textTransform: 'uppercase',
          color: color.muted, fontWeight: 500, marginBottom: 9,
        }}>{category}</div>
        <div style={{ fontFamily: font.display, fontSize: fontSize.lg, fontWeight: 700, marginBottom: 8, color: color.muted }}>
          Open seat
        </div>
        <div style={{ fontSize: fontSize.base, lineHeight: 1.65, opacity: 0.65 }}>
          We haven't vetted a {category.toLowerCase()} partner yet. Know someone good?
        </div>
      </div>
      <button type="button" onClick={onRequestReferral} style={{
        ...buttonReset, width: 'fit-content', marginTop: 14,
        background: 'none', border: `1px solid ${color.muted}`, color: color.muted,
        padding: '8px 14px', fontSize: fontSize.sm, letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase', cursor: 'pointer',
      }}>
        Refer a partner
      </button>
    </div>
  );
}

export { font };
