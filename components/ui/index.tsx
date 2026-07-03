'use client'

import type { CSSProperties, ReactNode } from 'react'
import { colors, layout, S } from '@/lib/theme'

export function PageShell({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div style={{ ...S.page, ...style }}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
  back,
  filters,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  back?: ReactNode
  filters?: ReactNode
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="inv-page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
          {back}
          <div style={{ minWidth: 0 }}>
            <h1 style={S.title}>{title}</h1>
            {subtitle && <p style={{ ...S.subtitle, marginTop: 8 }}>{subtitle}</p>}
          </div>
        </div>
        {(filters || action) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {filters}
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

export function BackButton({ onClick, label = 'Indietro' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inv-icon-btn inv-btn-glass"
      style={S.iconBtn}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function IconButton({
  onClick,
  children,
  variant = 'default',
  size = 44,
  label,
}: {
  onClick?: () => void
  children: ReactNode
  variant?: 'default' | 'accent' | 'danger'
  size?: number
  label?: string
}) {
  const bg =
    variant === 'accent'
      ? colors.accentBright
      : variant === 'danger'
        ? colors.dangerSoft
        : colors.bgElevated
  const color =
    variant === 'accent'
      ? colors.onAccent
      : variant === 'danger'
        ? colors.danger
        : colors.text

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={variant === 'default' ? 'inv-icon-btn inv-btn-glass' : 'inv-icon-btn'}
      style={{
        ...S.iconBtn,
        width: size,
        height: size,
        ...(variant !== 'default' ? { background: bg, border: variant === 'accent' ? 'none' : `1px solid ${colors.danger}` } : {}),
        color,
        boxShadow: variant === 'accent' ? '0 8px 28px rgba(6,182,212,0.32)' : undefined,
      }}
    >
      {children}
    </button>
  )
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  onSubmit,
  onClear,
  action,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  onSubmit?: (e: React.FormEvent) => void
  onClear?: () => void
  action?: ReactNode
}) {
  const inner = (
    <div className="inv-glass" style={S.searchBar}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={colors.textMuted} strokeWidth="1.8" />
        <path d="M20 20l-3-3" stroke={colors.textMuted} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: colors.text,
          fontSize: 15,
          padding: '14px 0',
          minWidth: 0,
        }}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      )}
      {action}
    </div>
  )

  if (onSubmit) {
    return <form onSubmit={onSubmit}>{inner}</form>
  }
  return inner
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="inv-btn-glass" style={{ ...S.chip, ...(active ? S.chipActive : {}) }}>
      {label}
    </button>
  )
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
      {children}
    </div>
  )
}

export function Card({
  children,
  style,
  accent,
  onClick,
}: {
  children: ReactNode
  style?: CSSProperties
  accent?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={onClick ? 'inv-card-click' : undefined}
      style={{
        ...(accent ? S.cardAccent : S.card),
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div style={{ ...S.card, overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 18px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <div style={S.sectionTitle}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  accent,
  highlight,
  onClick,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
  highlight?: string
  onClick?: () => void
}) {
  if (accent) {
    return (
      <div onClick={onClick} style={{ ...S.cardAccent, padding: '18px 18px', cursor: onClick ? 'pointer' : undefined }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75, marginBottom: 8 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
        {hint && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{hint}</div>}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...S.card,
        padding: '16px 18px',
        cursor: onClick ? 'pointer' : undefined,
        border: highlight ? `1px solid ${highlight}` : `1px solid ${colors.border}`,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: highlight ? highlight : colors.text, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>{hint}</div>}
    </div>
  )
}

export function SkuBadge({ sku }: { sku: string }) {
  return (
    <div style={S.skuBadge}>
      <span style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.04em' }}>SKU</span>
      <span style={{ fontSize: 13, color: colors.text, fontWeight: 800 }}>{sku}</span>
    </div>
  )
}

export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted, fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      {message}
    </div>
  )
}

export function Skeleton({ height, style }: { height: number; style?: CSSProperties }) {
  return <div style={{ ...S.skeleton, height, ...style }} />
}

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={S.overlay} />
      <div style={S.sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 40, height: 4, background: colors.border, borderRadius: 2 }} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="inv-icon-btn inv-btn-glass"
            style={{ ...S.iconBtn, width: 36, height: 36 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  fullWidth,
  style,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  style?: CSSProperties
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inv-btn inv-btn-primary"
      style={{
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  fullWidth,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  style?: CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inv-btn inv-btn-glass"
      style={{
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="inv-table-wrap">
      <div className="inv-table-min">{children}</div>
    </div>
  )
}

export function ExpandLink({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inv-icon-btn inv-btn-glass"
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        color: colors.textSecondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function FormLabel({ children }: { children: ReactNode }) {
  return <label style={S.label}>{children}</label>
}

export function FormInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  style,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  step?: string
  style?: CSSProperties
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...S.input, ...style, ...(type === 'date' ? { colorScheme: 'dark' } : {}) }}
    />
  )
}

export function FormSelect({
  value,
  onChange,
  children,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...S.input,
        appearance: 'none',
        WebkitAppearance: 'none',
        color: value ? colors.text : colors.textMuted,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        background: colors.dangerSoft,
        border: `1px solid ${colors.danger}`,
        borderRadius: radiusFromTheme(),
        padding: '12px 14px',
        color: colors.danger,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  )
}

function radiusFromTheme() {
  return 18
}

export { colors, S, layout, euro } from '@/lib/theme'
