import { NextResponse } from 'next/server'
import { supabase, computeGiorniRimanenti, computeStatoScadenza } from '@/lib/supabase'

function rowToItem(row: Record<string, string>) {
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
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await context.params
    const sku = decodeURIComponent(rawSku)

    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .eq('sku', sku)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 })

    return NextResponse.json({ item: rowToItem(data) })
  } catch (error) {
    console.error('GET /api/stock/[sku]:', error)
    return NextResponse.json({ error: 'Errore lettura foglio' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await context.params
    const sku = decodeURIComponent(rawSku)
    const body = await req.json()

    const { data: current, error: fetchError } = await supabase
      .from('stock')
      .select('*')
      .eq('sku', sku)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!current) return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 })

    const prevEsito = String(current.esito ?? '')
    const newEsito = body.esito !== undefined ? String(body.esito).trim() : prevEsito

    const updates: Record<string, string> = {}
    if (body.numeroOrdine !== undefined) updates.numero_ordine = body.numeroOrdine
    if (body.dataOrdine !== undefined) updates.data_ordine = body.dataOrdine
    if (body.prezzoAcquisto !== undefined) updates.prezzo_acquisto = body.prezzoAcquisto
    if (body.scadenzaReso !== undefined) updates.scadenza_reso = body.scadenzaReso
    if (body.esito !== undefined) updates.esito = body.esito
    if (body.idModello !== undefined) updates.id_modello = body.idModello
    if (body.taglia !== undefined) updates.taglia = body.taglia

    if (newEsito === 'Reso, ma in stock') {
      updates.prezzo_acquisto = '0'
      updates.scadenza_reso = ''
    }

    if (prevEsito === 'Venduto' && newEsito === 'In stock') {
      await supabase.from('vendite').delete().eq('sku', sku)
    }

    const { error } = await supabase
      .from('stock')
      .update(updates)
      .eq('sku', sku)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/stock/[sku]:', error)
    return NextResponse.json({ error: 'Errore aggiornamento foglio' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await context.params
    const sku = decodeURIComponent(rawSku)

    const { error } = await supabase
      .from('stock')
      .delete()
      .eq('sku', sku)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/stock/[sku]:', error)
    return NextResponse.json({ error: 'Errore eliminazione riga' }, { status: 500 })
  }
}
