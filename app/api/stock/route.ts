import { NextResponse } from 'next/server'
import { supabase, computeGiorniRimanenti, computeStatoScadenza, computeScadenzaReso, hasSupabaseConfig } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demo'
import { demoStockResponse } from '@/lib/demo-data'

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ ...demoStockResponse, demo: true })
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      {
        error: 'Manca .env.local: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
        code: 'MISSING_ENV',
        items: [],
      },
      { status: 503 }
    )
  }

  try {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .order('sku')

    if (error) throw error

    const items = (data || []).map((row) => {
      const giorniRimanenti = computeGiorniRimanenti(row.scadenza_reso || '')
      return {
        sku: row.sku || '',
        numeroOrdine: row.numero_ordine || '',
        dataOrdine: row.data_ordine || '',
        prezzoAcquisto: row.prezzo_acquisto || '',
        scadenzaReso: row.scadenza_reso || '',
        giorniRimanenti,
        statoScadenza: computeStatoScadenza(giorniRimanenti),
        esito: row.esito || '',
        idModello: row.id_modello || '',
        taglia: row.taglia || '',
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/stock:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sku = String(body.sku ?? '').trim()
    const numeroOrdine = String(body.numeroOrdine ?? '').trim()
    const dataOrdine = String(body.dataOrdine ?? '').trim()
    const prezzoAcquisto = String(body.prezzoAcquisto ?? '').trim()
    const idModello = String(body.idModello ?? '').trim()
    const taglia = String(body.taglia ?? '').trim()

    if (!sku || !numeroOrdine || !dataOrdine || !prezzoAcquisto || !idModello || !taglia) {
      return NextResponse.json({ error: 'Compila tutti i campi obbligatori' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('stock')
      .select('sku')
      .eq('sku', sku)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'SKU già presente nello stock' }, { status: 400 })
    }

    const { error } = await supabase.from('stock').insert({
      sku,
      numero_ordine: numeroOrdine,
      data_ordine: dataOrdine,
      prezzo_acquisto: prezzoAcquisto,
      scadenza_reso: computeScadenzaReso(dataOrdine),
      esito: 'In stock',
      id_modello: idModello,
      taglia,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/stock:', error)
    return NextResponse.json({ error: 'Errore creazione riga stock' }, { status: 500 })
  }
}
