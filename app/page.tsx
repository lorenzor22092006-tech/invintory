'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import SalesChart from '@/components/SalesChart'
import type { Vendita } from '@/lib/types'
import {
  PageShell,
  PageHeader,
  SearchBar,
  Card,
  SectionCard,
  SkuBadge,
  EmptyState,
  Skeleton,
  PrimaryButton,
  SecondaryButton,
  IconButton,
  ExpandLink,
  ErrorBox,
  Chip,
  ChipRow,
  TableScroll,
  colors,
  S,
} from '@/components/ui'

interface StockItem {
  sku: string
  numeroOrdine: string
  dataOrdine: string
  prezzoAcquisto: string
  scadenzaReso: string
  giorniRimanenti: number | null
  statoScadenza: string
  esito: string
  idModello: string
  taglia: string
}

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<'scadenza' | 'sku'>('scadenza')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)
  const [searchHit, setSearchHit] = useState<StockItem | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [mostraScaduti, setMostraScaduti] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [vendite, setVendite] = useState<Vendita[]>([])
  const [venditeLoading, setVenditeLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendite')
      .then((r) => r.json())
      .then((data: Vendita[]) => {
        setVendite(Array.isArray(data) ? data : [])
        setVenditeLoading(false)
      })
      .catch(() => setVenditeLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/stock')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) {
          setLoadError(data.error || 'Impossibile caricare lo stock')
          setItems([])
          setLoading(false)
          return
        }
        setItems(data.items || [])
        setLoadError(null)
        setLoading(false)
      })
      .catch(() => {
        setLoadError('Errore di rete durante il caricamento dello stock')
        setLoading(false)
      })
  }, [])

  const inScadenza = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.esito === 'In stock' &&
        item.giorniRimanenti !== null &&
        item.giorniRimanenti >= 0
    )
    return [...filtered].sort((a, b) => {
      const cmp = sortMode === 'sku'
        ? a.sku.localeCompare(b.sku, 'it', { numeric: true })
        : (a.giorniRimanenti ?? 0) - (b.giorniRimanenti ?? 0)
      return sortAsc ? cmp : -cmp
    })
  }, [items, sortMode, sortAsc])

  const scaduti = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.esito === 'In stock' &&
        item.giorniRimanenti !== null &&
        item.giorniRimanenti < 0
    )
    return [...filtered].sort((a, b) => (b.giorniRimanenti ?? 0) - (a.giorniRimanenti ?? 0))
  }, [items])

  const urgentCount = useMemo(
    () =>
      inScadenza.filter(
        (item) => item.giorniRimanenti !== null && item.giorniRimanenti <= 7
      ).length,
    [inScadenza]
  )

  useEffect(() => {
    if (!search.trim()) {
      setSearchHit(null)
      setSearchError(null)
    }
  }, [search])

  function findProductBySkuQuery(q: string): StockItem | null {
    const ql = q.trim().toLowerCase()
    if (!ql) return null
    const norm = (s: string) => s.trim().toLowerCase()
    const exact = items.find((i) => norm(i.sku) === ql)
    if (exact) return exact
    const starts = items.filter((i) => norm(i.sku).startsWith(ql))
    if (starts.length >= 1) {
      return [...starts].sort((a, b) => norm(a.sku).length - norm(b.sku).length)[0]
    }
    const incl = items.filter((i) => norm(i.sku).includes(ql))
    if (incl.length >= 1) {
      return [...incl].sort((a, b) => norm(a.sku).length - norm(b.sku).length)[0]
    }
    return null
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    setSearchHit(null)
    setSearchError(null)
    if (!q) return
    if (loading) {
      setSearchError('Attendi il caricamento dello stock e riprova.')
      return
    }
    const hit = findProductBySkuQuery(q)
    if (hit) {
      setSearchHit(hit)
    } else {
      setSearchError(`Nessun prodotto con SKU che corrisponde a «${q}».`)
    }
  }

  const clearSearchBanner = () => {
    setSearchHit(null)
    setSearchError(null)
  }

  const getScadenzaColor = (giorni: number | null) => {
    if (giorni === null) return colors.textMuted
    if (giorni <= 3) return colors.danger
    if (giorni <= 7) return colors.warning
    return colors.success
  }

  const getScadenzaLabel = (giorni: number | null) => {
    if (giorni === null) return ''
    if (giorni === 0) return 'Scade oggi'
    if (giorni === 1) return '1 giorno'
    return `${giorni} giorni`
  }

  function TableRow({
    item,
    danger,
    onEdit,
  }: {
    item: StockItem
    danger?: boolean
    onEdit: () => void
  }) {
    return (
      <div
        style={{
          ...S.tableRow,
          background: danger ? colors.dangerSoft : 'transparent',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgMuted }}
        onMouseLeave={(e) => { e.currentTarget.style.background = danger ? colors.dangerSoft : 'transparent' }}
      >
        <span style={{ fontWeight: 800, color: colors.accentBright, fontSize: 13 }}>{item.sku}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.idModello || '—'}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.numeroOrdine || '—'}</div>
        </div>
        <span style={{ color: colors.textSecondary, fontSize: 13 }}>{item.taglia || 'n.d.'}</span>
        <span style={{ color: colors.textSecondary, fontSize: 13 }}>{item.scadenzaReso || '—'}</span>
        <span style={{ fontWeight: 800, color: danger ? colors.danger : getScadenzaColor(item.giorniRimanenti), fontSize: 13 }}>
          {danger ? `${Math.abs(item.giorniRimanenti ?? 0)} gg fa` : getScadenzaLabel(item.giorniRimanenti)}
        </span>
        <IconButton onClick={onEdit} label={`Modifica ${item.sku}`} size={36}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      </div>
    )
  }

  return (
    <PageShell>
      {/* FAB mobile: registra vendita (stile design, animato) */}
      <button
        type="button"
        onClick={() => router.push('/vendite/nuova')}
        className="inv-mobile-only inv-btn inv-btn-primary inv-fab"
        style={{
          position: 'fixed',
          bottom: 'var(--inv-fab-bottom)',
          right: 18,
          zIndex: 45,
          padding: '13px 22px',
          fontSize: 13,
          alignItems: 'center',
          gap: 6,
        }}
      >
        + Vendita
      </button>

      {loadError && (
        <div style={{ marginBottom: 20 }}>
          <ErrorBox message={loadError} />
        </div>
      )}
      <PageHeader
        title="Dashboard"
        subtitle="Gestisci il tuo stock Rubinos Sellers"
        filters={
          <ChipRow>
            <Chip label={loading ? '…' : `${inScadenza.length} in scadenza`} active />
            <Chip label={loading ? '…' : `${urgentCount} urgenti`} />
            <Chip label={loading ? '…' : `${scaduti.length} scaduti`} onClick={() => setMostraScaduti((v) => !v)} />
          </ChipRow>
        }
        action={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <SecondaryButton onClick={() => router.push('/stock/nuovo')}>+ Prodotto</SecondaryButton>
            <PrimaryButton onClick={() => router.push('/vendite/nuova')}>+ Registra Vendita</PrimaryButton>
          </div>
        }
      />

      {/* CHART + SIDE COLUMN */}
      <div className="inv-grid-kpi" style={{ marginBottom: 24 }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <SalesChart vendite={vendite} loading={venditeLoading} />
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: '20px 22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 18, right: 18 }}>
              <ExpandLink onClick={() => router.push('/bilancio/scadenze')} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Prossime scadenze
            </div>
            {loading ? (
              <Skeleton height={120} />
            ) : inScadenza.length === 0 ? (
              <EmptyState icon="✓" message="Nessuna scadenza attiva" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {inScadenza.slice(0, 5).map((item, i) => (
                  <div
                    key={item.sku}
                    onClick={() => router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 0',
                      borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 800, color: colors.accentBright, minWidth: 34 }}>{item.sku}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.idModello || '—'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: getScadenzaColor(item.giorniRimanenti), flexShrink: 0 }}>
                      {getScadenzaLabel(item.giorniRimanenti)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Azioni rapide
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SecondaryButton fullWidth onClick={() => router.push('/resi/nuovo')}>Registra Reso</SecondaryButton>
              <SecondaryButton fullWidth onClick={() => router.push('/taglie')}>Vai ai Modelli</SecondaryButton>
              <SecondaryButton fullWidth onClick={() => router.push('/bilancio')}>Apri Bilancio</SecondaryButton>
            </div>
          </Card>
        </div>
      </div>

      {/* SEARCH BAR ROW */}
      <div style={{ marginBottom: 24 }}>
        <div>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Cerca per SKU…"
            onSubmit={handleSearch}
            onClear={() => setSearch('')}
            action={
              search ? (
                <button type="submit" className="inv-btn inv-btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                  Cerca
                </button>
              ) : undefined
            }
          />
          {(searchHit || searchError) && (
            <div style={{ marginTop: 14 }}>
              {searchHit ? (
                <Card style={{ padding: '20px 24px', border: `1px solid ${colors.borderStrong}`, position: 'relative' }}>
                  <button type="button" onClick={clearSearchBanner} aria-label="Chiudi" className="inv-icon-btn inv-btn-glass" style={{ ...S.iconBtn, position: 'absolute', top: 14, right: 14, width: 36, height: 36 }}>×</button>
                  <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 800, color: colors.accentBright, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risultato ricerca</p>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <SkuBadge sku={searchHit.sku} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{searchHit.idModello || '—'}</div>
                      <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                        Taglia {searchHit.taglia || 'n.d.'} · {searchHit.esito}
                      </div>
                    </div>
                    <PrimaryButton onClick={() => router.push(`/stock/${encodeURIComponent(searchHit.sku)}/modifica`)}>
                      Modifica
                    </PrimaryButton>
                  </div>
                </Card>
              ) : (
                <ErrorBox message={searchError!} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* SCADUTI TABLE */}
      {mostraScaduti && (
        <div style={{ marginBottom: 24 }}>
        <SectionCard title="Articoli scaduti" subtitle={`${scaduti.length} prodotti oltre la scadenza reso`}>
          {loading ? (
            <div style={{ padding: 20 }}><Skeleton height={120} /></div>
          ) : scaduti.length === 0 ? (
            <EmptyState icon="✓" message="Nessun articolo scaduto" />
          ) : (
            <TableScroll>
              <div style={S.tableHeader}>
                <span>SKU</span><span>Modello</span><span>Taglia</span><span>Scadenza</span><span>Stato</span><span />
              </div>
              {scaduti.map((item) => (
                <TableRow key={item.sku} item={item} danger onEdit={() => router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)} />
              ))}
            </TableScroll>
          )}
        </SectionCard>
        </div>
      )}

      {/* PRODOTTI IN SCADENZA TABLE */}
      <SectionCard
        title="Prodotti in scadenza"
        subtitle={loading ? 'Caricamento…' : `${inScadenza.length} prodotti attivi`}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setSortMenuOpen((v) => !v)} className="inv-btn-glass" style={{ ...S.chip, ...(sortMenuOpen ? S.chipActive : {}), padding: '7px 14px', fontSize: 12 }}>
                {sortMode === 'scadenza' ? 'Per scadenza' : 'Per SKU'} ▾
              </button>
              {sortMenuOpen && (
                <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 40, ...S.card, overflow: 'hidden', minWidth: 160, padding: 0 }}>
                  {(['scadenza', 'sku'] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => { setSortMode(mode); setSortMenuOpen(false) }}
                      style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: mode === 'scadenza' ? `1px solid ${colors.border}` : 'none', background: sortMode === mode ? colors.accentSoft : 'transparent', color: sortMode === mode ? colors.accentBright : colors.text, fontSize: 13, fontWeight: sortMode === mode ? 700 : 400, cursor: 'pointer' }}>
                      {mode === 'scadenza' ? 'Per scadenza' : 'Per SKU'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <IconButton onClick={() => setSortAsc((v) => !v)} label="Inverti ordine" size={36}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: sortAsc ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s ease' }}>
                <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconButton>
          </div>
        }
      >
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} />)}
          </div>
        ) : inScadenza.length === 0 ? (
          <EmptyState icon="✓" message="Nessun prodotto in scadenza" />
        ) : (
          <TableScroll>
            <div style={S.tableHeader}>
              <span>SKU</span><span>Modello</span><span>Taglia</span><span>Scadenza</span><span>Giorni</span><span />
            </div>
            {inScadenza.map((item) => (
              <TableRow key={item.sku} item={item} onEdit={() => router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)} />
            ))}
          </TableScroll>
        )}
      </SectionCard>
    </PageShell>
  )
}
