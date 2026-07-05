import { NextResponse } from 'next/server'
import { requireCeo } from '@/lib/auth'
import { readSheet } from '@/lib/sheets'
import { supabase, parseEuro } from '@/lib/supabase'

function parseEuroStr(val: string): number {
  return parseFloat(String(val).replace('€', '').replace(',', '.').replace(/\s/g, '').trim()) || 0
}

export async function POST() {
  if (!(await requireCeo())) return NextResponse.json({ error: 'Operazione riservata al CEO' }, { status: 403 })

  try {
    const results: Record<string, unknown> = {}

    // 1. STOCK
    const stockRows = await readSheet('STOCK!A2:J5000')
    const stockData = stockRows
      .filter((r) => String(r[0] ?? '').trim())
      .map((r) => ({
        sku: String(r[0] ?? '').trim(),
        numero_ordine: String(r[1] ?? '').trim(),
        data_ordine: String(r[2] ?? '').trim(),
        prezzo_acquisto: String(r[3] ?? '').trim(),
        scadenza_reso: String(r[4] ?? '').trim(),
        esito: String(r[7] ?? '').trim() || 'In stock',
        id_modello: String(r[8] ?? '').trim(),
        taglia: String(r[9] ?? '').trim(),
      }))

    if (stockData.length > 0) {
      const { error, count } = await supabase
        .from('stock')
        .upsert(stockData, { onConflict: 'sku', count: 'exact' })
      results.stock = error ? { error: error.message } : { count }
    } else {
      results.stock = { count: 0 }
    }

    // 2. VENDITE
    const venditeRows = await readSheet('VENDITE!A2:K5000')
    const venditeData = venditeRows
      .filter((r) => String(r[0] ?? '').trim())
      .map((r) => ({
        sku: String(r[0] ?? '').trim(),
        id_modello: String(r[1] ?? '').trim(),
        taglia: String(r[2] ?? '').trim(),
        data_vendita: String(r[3] ?? '').trim(),
        prezzo_acquisto: parseEuroStr(String(r[4] ?? '')),
        prezzo_vendita: parseEuroStr(String(r[5] ?? '')),
        guadagno_lordo: parseEuroStr(String(r[6] ?? '')),
        venditore: String(r[7] ?? '').trim(),
        fee: parseEuroStr(String(r[8] ?? '')),
        guadagno_netto: parseEuroStr(String(r[9] ?? '')),
        nota: String(r[10] ?? '').trim(),
      }))

    if (venditeData.length > 0) {
      // Delete existing and re-insert
      await supabase.from('vendite').delete().neq('id', 0)
      const { error, count } = await supabase
        .from('vendite')
        .insert(venditeData, { count: 'exact' })
      results.vendite = error ? { error: error.message } : { count }
    } else {
      results.vendite = { count: 0 }
    }

    // 3. CONFIG venditori
    const configRows = await readSheet('CONFIG!A2:B')
    const venditori = configRows
      .filter((r) => String(r[0] ?? '').trim())
      .map((r) => ({
        nome: String(r[0] ?? '').trim(),
        fee_percentuale: parseFloat(String(r[1] ?? '').replace('%', '')) || 0,
      }))

    if (venditori.length > 0) {
      const { error, count } = await supabase
        .from('config_venditori')
        .upsert(venditori, { onConflict: 'nome', count: 'exact' })
      results.config_venditori = error ? { error: error.message } : { count }
    } else {
      results.config_venditori = { count: 0 }
    }

    // 4. CONFIG categorie
    const catRows = await readSheet('CONFIG!D2:D')
    const categorie = catRows
      .filter((r) => String(r[0] ?? '').trim())
      .map((r) => ({ nome: String(r[0] ?? '').trim() }))

    if (categorie.length > 0) {
      const { error, count } = await supabase
        .from('config_categorie')
        .upsert(categorie, { onConflict: 'nome', count: 'exact' })
      results.config_categorie = error ? { error: error.message } : { count }
    } else {
      results.config_categorie = { count: 0 }
    }

    // 5. TAGLIE_STOCK
    const taglieRows = await readSheet('TAGLIE_STOCK!A2:C5000')
    const taglieData = taglieRows
      .filter((r) => String(r[0] ?? '').trim())
      .map((r) => ({
        id_modello: String(r[0] ?? '').trim().toUpperCase(),
        categoria: String(r[1] ?? '').trim(),
        foto_url: String(r[2] ?? '').trim(),
      }))

    if (taglieData.length > 0) {
      const { error, count } = await supabase
        .from('taglie_stock')
        .upsert(taglieData, { onConflict: 'id_modello', count: 'exact' })
      results.taglie_stock = error ? { error: error.message } : { count }
    } else {
      results.taglie_stock = { count: 0 }
    }

    // 6. PAGAMENTI_VENDITORI
    try {
      const pagamentiRows = await readSheet('PAGAMENTI_VENDITORI!A2:D')
      const pagamentiData = pagamentiRows
        .filter((r) => String(r[0] ?? '').trim())
        .map((r) => ({
          venditore: String(r[0] ?? '').trim(),
          importo: parseEuroStr(String(r[1] ?? '')),
          data: String(r[2] ?? '').trim(),
          nota: String(r[3] ?? '').trim(),
        }))

      if (pagamentiData.length > 0) {
        await supabase.from('pagamenti_venditori').delete().neq('id', 0)
        const { error, count } = await supabase
          .from('pagamenti_venditori')
          .insert(pagamentiData, { count: 'exact' })
        results.pagamenti_venditori = error ? { error: error.message } : { count }
      } else {
        results.pagamenti_venditori = { count: 0 }
      }
    } catch {
      results.pagamenti_venditori = { skipped: 'foglio non trovato' }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Migration error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
