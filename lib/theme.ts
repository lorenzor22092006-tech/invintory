import type { CSSProperties } from 'react'

/** Invintory desktop design tokens — Stockify-inspired dashboard */
export const colors = {
  bg: '#050810',
  bgCard: 'rgba(4, 8, 18, 0.24)',
  bgElevated: 'rgba(255, 255, 255, 0.06)',
  bgInput: 'rgba(4, 8, 18, 0.22)',
  bgMuted: 'rgba(255, 255, 255, 0.04)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(0, 215, 240, 0.3)',
  accent: '#00bcd4',
  accentBright: '#22d3ee',
  accentDark: '#0E7490',
  accentSoft: 'rgba(0, 188, 212, 0.14)',
  accentGlow: 'rgba(0, 190, 218, 0.4)',
  text: '#F8FAFC',
  textSecondary: 'rgba(255, 255, 255, 0.55)',
  textMuted: 'rgba(255, 255, 255, 0.35)',
  onAccent: '#001520',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.12)',
  success: '#22C55E',
} as const

export const radius = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 28,
  xxl: 32,
  pill: 999,
} as const

export const shadow = {
  card: '0 8px 32px rgba(0, 0, 0, 0.38)',
  accent: '0 8px 32px rgba(6, 182, 212, 0.28)',
  nav: '0 12px 48px rgba(0, 0, 0, 0.45)',
  float: '0 4px 20px rgba(0, 0, 0, 0.25)',
} as const

/** Prismatic liquid-glass surface (Figma design): gradient border via
    double-background trick + deep translucent core + heavy blur */
export const glass = {
  background:
    'linear-gradient(rgba(6, 10, 22, 0.28), rgba(6, 10, 22, 0.28)) padding-box, ' +
    'linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 45%, rgba(255, 255, 255, 0.18) 100%) border-box',
  border: '1px solid transparent',
  boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
} as const

/** Liquid cyan pill (LiquidBtn del design) */
export const liquid = {
  gradient:
    'linear-gradient(172deg, rgba(165,245,255,0.52) 0%, rgba(0,215,240,0.78) 18%, rgba(0,185,215,0.94) 44%, rgba(0,148,185,1) 68%, rgba(0,102,140,1) 100%)',
  shadow:
    'inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -3px 8px rgba(0,20,30,0.35), 0 6px 20px rgba(0,190,218,0.22)',
  shadowSmall:
    'inset 0 1.5px 4px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,20,30,0.3), 0 4px 14px rgba(0,190,218,0.18)',
} as const

export const layout = {
  maxWidth: 1400,
  /* Responsive: values live in globals.css :root and shrink on mobile */
  pagePadX: 'var(--inv-pad-x)',
  pagePadY: 'var(--inv-pad-y)',
  pagePadBottom: 'var(--inv-main-pad-bottom)',
  navHeight: 'var(--inv-nav-height)',
  contentTop: 24,
} as const

export const fonts = {
  sans: 'var(--font-jakarta), system-ui, sans-serif',
  display: 'var(--font-syne), var(--font-jakarta), system-ui, sans-serif',
} as const

/** Reusable style fragments for inline styles across pages */
export const S: Record<string, CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: colors.bg,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: layout.maxWidth,
    margin: '0 auto',
    padding: `${layout.contentTop}px ${layout.pagePadX} ${layout.pagePadBottom}`,
    fontFamily: fonts.sans,
    boxSizing: 'border-box',
  },
  pagePad: {
    padding: `${layout.pagePadY} ${layout.pagePadX} 0`,
  },
  pagePadForm: {
    padding: `${layout.pagePadY} ${layout.pagePadX} ${layout.pagePadBottom}`,
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: layout.maxWidth,
    margin: '0 auto',
  },
  card: {
    ...glass,
    borderRadius: radius.xl,
  },
  cardAccent: {
    background: liquid.gradient,
    borderRadius: radius.xxl,
    color: colors.onAccent,
    boxShadow: liquid.shadow,
  },
  cardInset: {
    background: 'rgba(255, 255, 255, 0.045)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: radius.md,
  },
  input: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 15,
    padding: '13px 16px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: fonts.sans,
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  title: {
    fontSize: 'var(--inv-title-size)',
    fontWeight: 800,
    color: colors.text,
    margin: 0,
    fontFamily: fonts.display,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    margin: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
    margin: 0,
  },
  chip: {
    flexShrink: 0,
    padding: '8px 16px',
    borderRadius: radius.pill,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
  },
  chipActive: {
    background: liquid.gradient,
    border: 'none',
    color: colors.onAccent,
    fontWeight: 700,
    boxShadow: liquid.shadowSmall,
  },
  btnPrimary: {
    background: liquid.gradient,
    border: 'none',
    borderRadius: radius.pill,
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: 800,
    padding: '12px 22px',
    cursor: 'pointer',
    boxShadow: shadow.accent,
    fontFamily: fonts.sans,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  btnSecondary: {
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 14,
    fontWeight: 700,
    padding: '12px 22px',
    cursor: 'pointer',
    fontFamily: fonts.sans,
    transition: 'background 0.15s ease',
  },
  btnGhost: {
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: 600,
    padding: '10px 14px',
    cursor: 'pointer',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    color: colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s ease',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: radius.pill,
    padding: '0 18px',
    gap: 10,
  },
  skuBadge: {
    minWidth: 48,
    height: 48,
    borderRadius: radius.sm,
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listRow: {
    ...glass,
    borderRadius: radius.lg,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr 120px 140px 100px 80px',
    gap: 16,
    padding: '12px 20px',
    fontSize: 11,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: `1px solid ${colors.border}`,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr 120px 140px 100px 80px',
    gap: 16,
    padding: '14px 20px',
    alignItems: 'center',
    borderBottom: `1px solid ${colors.border}`,
    transition: 'background 0.15s ease',
  },
  sheet: {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: 480,
    zIndex: 51,
    ...glass,
    background: 'linear-gradient(180deg, rgba(30, 42, 46, 0.85) 0%, rgba(13, 20, 22, 0.9) 100%)',
    borderRadius: radius.xl,
    padding: '28px 28px 32px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.72)',
    zIndex: 50,
    backdropFilter: 'blur(6px)',
  },
  skeleton: {
    background: colors.bgCard,
    borderRadius: radius.lg,
    opacity: 0.55,
    animation: 'inv-pulse 1.5s ease-in-out infinite',
  },
}

export function euro(n: number): string {
  const safe = Number.isFinite(n) ? n : 0
  return '€' + safe.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
