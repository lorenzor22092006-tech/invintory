'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  SearchBar,
  Card,
  SectionCard,
  SkuBadge,
  EmptyState,
  Skeleton,
  PrimaryButton,
  SecondaryButton,
  IconButton,
  ErrorBox,
  Chip,
  ChipRow,
  TableScroll,
  colors,
  S,
} from '@/components/ui'

export interface StockItem {
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

const URGENTE_GIORNI = 15

/** Esploratore stock condiviso da Home CEO e Home venditore: ricerca (SKU/taglia/modello),
    box scadenze urgenti (<15gg, opzionale), tendina "Prodotti in scadenza" con filtri interni.
    Un solo componente per entrambe le pagine: un fix qui vale per tutti i ruoli. */
export default function StockExplorer({ showUrgentBox = false }: { showUrgentBox?: boolean }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<'scadenza' | 'sku'>('sku')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)
  const [searchHits, setSearchHits] = useState<StockItem[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [mostraScaduti, setMostraScaduti] = useState(false)
  const [listaOpen, setListaOpen] = useState(false)
  const [expandedSku, setExpandedSku] = useState<string | null>(null)
  const [copiedSku, setCopiedSku] = useState<string | null>(null)

  const copyOrdine = (item: StockItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.numeroOrdine) return
    navigator.clipboard?.writeText(item.numeroOrdine).catch(() => {})
    setCopiedSku(item.sku)
    setTimeout(() => setCopiedSku((cur) => (cur === item.sku ? null : cur)), 1500)
  }

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
      (item) => item.esito === 'In stock' && item.giorniRimanenti !== null && item.giorniRimanenti >= 0
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
      (item) => item.esito === 'In stock' && item.giorniRimanenti !== null && item.giorniRimanenti < 0
    )
    return [...filtered].sort((a, b) => (b.giorniRimanenti ?? 0) - (a.giorniRimanenti ?? 0))
  }, [items])

  const urgentCount = useMemo(
    () => inScadenza.filter((item) => item.giorniRimanenti !== null && item.giorniRimanenti <= 7).length,
    [inScadenza]
  )

  // scadenze imminenti (<15gg): per il box dedicato CEO/main
  const urgenti15 = useMemo(
    () => inScadenza.filter((item) => item.giorniRimanenti !== null && item.giorniRimanenti < URGENTE_GIORNI),
    [inScadenza]
  )

  useEffect(() => {
    if (!search.trim()) {
      setSearchHits(null)
      setSearchError(null)
    }
  }, [search])

  // ricerca per SKU, taglia o modello — restituisce tutti i risultati che matchano
  function findProducts(q: string): StockItem[] {
    const ql = q.trim().toLowerCase()
    if (!ql) return []
    const norm = (s: string) => s.trim().toLowerCase()
    return items.filter(
      (i) => norm(i.sku).includes(ql) || norm(i.taglia).includes(ql) || norm(i.idModello).includes(ql)
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    setSearchHits(null)
    setSearchError(null)
    if (!q) return
    if (loading) {
      setSearchError('Attendi il caricamento dello stock e riprova.')
      return
    }
    const hits = findProducts(q)
    if (hits.length > 0) {
      setSearchHits(hits.slice(0, 20))
    } else {
      setSearchError(`Nessun prodotto trovato per «${q}».`)
    }
  }

  const clearSearchBanner = () => {
    setSearchHits(null)
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

  function TableRow({ item, danger, onEdit }: { item: StockItem; danger?: boolean; onEdit: () => void }) {
    return (
      <div
        style={{ ...S.tableRow, background: danger ? colors.dangerSoft : 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgMuted }}
        onMouseLeave={(e) => { e.currentTarget.style.background = danger ? colors.dangerSoft : 'transparent' }}
      >
        <span style={{ fontWeight: 800, color: colors.accentBright, fontSize: 13 }}>{item.sku}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.idModello || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.numeroOrdine || '—'}</span>
            {item.numeroOrdine && (
              <button
                type="button"
                onClick={(e) => copyOrdine(item, e)}
                aria-label={`Copia numero ordine ${item.numeroOrdine}`}
                title="Copia numero ordine"
                style={{ flexShrink: 0, border: 'none', background: 'transparent', color: copiedSku === item.sku ? colors.success : colors.textMuted, cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                {copiedSku === item.sku ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.8" /></svg>
                )}
              </button>
            )}
          </div>
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

  function MobileStockRow({ item, danger }: { item: StockItem; danger?: boolean }) {
    const open = expandedSku === item.sku
    const giorniLabel = danger ? `${Math.abs(item.giorniRimanenti ?? 0)} gg fa` : getScadenzaLabel(item.giorniRimanenti)
    const giorniColor = danger ? colors.danger : getScadenzaColor(item.giorniRimanenti)
    return (
      <div style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div
          onClick={() => setExpandedSku(open ? null : item.sku)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer', background: danger ? colors.dangerSoft : 'transparent' }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: colors.accentBright, minWidth: 36 }}>{item.sku}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.idModello || '—'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: giorniColor, flexShrink: 0 }}>{giorniLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
            <path d="M6 9l6 6 6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {open && (
          <div style={{ padding: '2px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 12px', fontSize: 12 }}>
              <div>
                <div style={{ color: colors.textMuted, marginBottom: 2 }}>Taglia</div>
                <div style={{ color: colors.text, fontWeight: 600 }}>{item.taglia || 'n.d.'}</div>
              </div>
              <div>
                <div style={{ color: colors.textMuted, marginBottom: 2 }}>Scadenza reso</div>
                <div style={{ color: colors.text, fontWeight: 600 }}>{item.scadenzaReso || '—'}</div>
              </div>
              <div>
                <div style={{ color: colors.textMuted, marginBottom: 2 }}>Prezzo acquisto</div>
                <div style={{ color: colors.text, fontWeight: 600 }}>{item.prezzoAcquisto || '—'}</div>
              </div>
              <div>
                <div style={{ color: colors.textMuted, marginBottom: 2 }}>N. ordine</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: colors.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.numeroOrdine || '—'}</span>
                  {item.numeroOrdine && (
                    <button
                      type="button"
                      onClick={(e) => copyOrdine(item, e)}
                      aria-label={`Copia numero ordine ${item.numeroOrdine}`}
                      style={{ flexShrink: 0, border: 'none', background: copiedSku === item.sku ? colors.accentSoft : colors.bgMuted, color: copiedSku === item.sku ? colors.success : colors.textMuted, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                    >
                      {copiedSku === item.sku ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          Copiato
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.8" /></svg>
                          Copia
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <SecondaryButton
              fullWidth
              style={{ padding: '10px 16px', fontSize: 13 }}
              onClick={() => router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)}
            >
              Modifica prodotto
            </SecondaryButton>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {loadError && (
        <div style={{ marginBottom: 20 }}>
          <ErrorBox message={loadError} />
        </div>
      )}

      {/* RICERCA — per SKU, taglia o modello */}
      <div style={{ marginBottom: 24 }}>
        <div>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Cerca per SKU, taglia o modello…"
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
          {(searchHits || searchError) && (
            <div style={{ marginTop: 14 }}>
              {searchHits ? (
                <Card style={{ padding: '16px 18px', border: `1px solid ${colors.borderStrong}`, position: 'relative' }}>
                  <button type="button" onClick={clearSearchBanner} aria-label="Chiudi" className="inv-icon-btn inv-btn-glass" style={{ ...S.iconBtn, position: 'absolute', top: 10, right: 10, width: 32, height: 32 }}>×</button>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, color: colors.accentBright, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {searchHits.length} risultat{searchHits.length === 1 ? 'o' : 'i'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {searchHits.map((hit) => (
                      <div key={hit.sku} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <SkuBadge sku={hit.sku} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hit.idModello || '—'}</div>
                          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                            Taglia {hit.taglia || 'n.d.'} · {hit.esito}
                          </div>
                        </div>
                        <SecondaryButton style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => router.push(`/stock/${encodeURIComponent(hit.sku)}/modifica`)}>
                          Apri
                        </SecondaryButton>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <ErrorBox message={searchError!} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOX SCADENZE URGENTI (<15gg) — solo CEO/main */}
      {showUrgentBox && (
        <div style={{ marginBottom: 24 }}>
          <SectionCard title="Scadenze imminenti" subtitle={`Capi che scadono entro ${URGENTE_GIORNI} giorni`}>
            {loading ? (
              <div style={{ padding: 20 }}><Skeleton height={80} /></div>
            ) : urgenti15.length === 0 ? (
              <EmptyState icon="✓" message="Nessun capo in scadenza imminente" />
            ) : (
              <div>
                {urgenti15.map((item, i) => (
                  <div
                    key={item.sku}
                    onClick={() => router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', cursor: 'pointer',
                      borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 800, color: colors.accentBright, minWidth: 34 }}>{item.sku}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.idModello || '—'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: getScadenzaColor(item.giorniRimanenti) }}>
                      {getScadenzaLabel(item.giorniRimanenti)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* PULSANTE A TENDINA: prodotti in scadenza (con filtri dentro), chiuso di default */}
      <div style={{ marginBottom: listaOpen ? 24 : 0 }}>
        <button
          type="button"
          onClick={() => setListaOpen((v) => !v)}
          className="inv-btn-glass"
          style={{
            ...S.card,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            cursor: 'pointer',
            border: `1px solid ${colors.border}`,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
            Prodotti in scadenza {loading ? '' : `(${inScadenza.length})`}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: listaOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
            <path d="M6 9l6 6 6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {listaOpen && (
        <>
          {/* FILTRI */}
          <div style={{ marginBottom: 14 }}>
            <ChipRow>
              <Chip label={loading ? '…' : `${inScadenza.length} in scadenza`} active />
              <Chip label={loading ? '…' : `${urgentCount} urgenti`} />
              <Chip label={loading ? '…' : `${scaduti.length} scaduti`} onClick={() => setMostraScaduti((v) => !v)} />
            </ChipRow>
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
                  <>
                    <div className="inv-mobile-only" style={{ flexDirection: 'column' }}>
                      {scaduti.map((item) => (
                        <MobileStockRow key={item.sku} item={item} danger />
                      ))}
                    </div>
                    <div className="inv-desktop-only" style={{ flexDirection: 'column' }}>
                      <TableScroll>
                        <div style={S.tableHeader}>
                          <span>SKU</span><span>Modello</span><span>Taglia</span><span>Scadenza</span><span>Stato</span><span />
                        </div>
                        {scaduti.map((item) => (
                          <TableRow key={item.sku} item={item} danger onEdit={() => router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)} />
                        ))}
                      </TableScroll>
                    </div>
                  </>
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
              <>
                <div className="inv-mobile-only" style={{ flexDirection: 'column' }}>
                  {inScadenza.map((item) => (
                    <MobileStockRow key={item.sku} item={item} />
                  ))}
                </div>
                <div className="inv-desktop-only" style={{ flexDirection: 'column' }}>
                  <TableScroll>
                    <div style={S.tableHeader}>
                      <span>SKU</span><span>Modello</span><span>Taglia</span><span>Scadenza</span><span>Giorni</span><span />
                    </div>
                    {inScadenza.map((item) => (
                      <TableRow key={item.sku} item={item} onEdit={() => router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)} />
                    ))}
                  </TableScroll>
                </div>
              </>
            )}
          </SectionCard>
        </>
      )}
    </>
  )
}
