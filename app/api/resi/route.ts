import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('resi')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    const resi = (data || []).map((row) => ({
      sku: row.sku || '',
      idModello: row.id_modello || '',
      taglia: row.taglia || '',
      numeroOrdine: row.numero_ordine || '',
      prezzoAcquisto: row.prezzo_acquisto || '',
      dataReso: row.data_reso || '',
    }))

    return NextResponse.json(resi)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura resi' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const skus: string[] = (body.skus ?? []).map((s: unknown) => String(s).trim()).filter(Boolean)

    if (skus.length === 0) {
      return NextResponse.json({ error: 'Inserisci almeno uno SKU' }, { status: 400 })
    }

    const oggi = new Date()
    const dataReso = `${String(oggi.getDate()).padStart(2, '0')}/${String(oggi.getMonth() + 1).padStart(2, '0')}/${oggi.getFullYear()}`

    const risultati: { sku: string; ok: boolean; errore?: string }[] = []

    for (const sku of skus) {
      const { data: capo, error } = await supabase
        .from('stock')
        .select('*')
        .eq('sku', sku)
        .maybeSingle()

      if (error || !capo) {
        risultati.push({ sku, ok: false, errore: 'SKU non trovato' })
        continue
      }
      if (capo.esito === 'Reso') {
        risultati.push({ sku, ok: false, errore: 'Già segnato come reso' })
        continue
      }
      if (capo.esito === 'Venduto') {
        risultati.push({ sku, ok: false, errore: 'Capo già venduto' })
        continue
      }

      const { error: updateError } = await supabase
        .from('stock')
        .update({ esito: 'Reso' })
        .eq('sku', sku)

      if (updateError) {
        risultati.push({ sku, ok: false, errore: 'Errore aggiornamento' })
        continue
      }

      await supabase.from('resi').insert({
        sku: capo.sku,
        id_modello: capo.id_modello || '',
        taglia: capo.taglia || '',
        numero_ordine: capo.numero_ordine || '',
        prezzo_acquisto: capo.prezzo_acquisto || '',
        data_reso: dataReso,
      })

      risultati.push({ sku, ok: true })
    }

    const errori = risultati.filter((r) => !r.ok)
    if (errori.length === skus.length) {
      return NextResponse.json({ error: 'Nessun SKU valido', risultati }, { status: 400 })
    }

    return NextResponse.json({ success: true, risultati })
  } catch (error) {
    return NextResponse.json({ error: 'Errore registrazione resi' }, { status: 500 })
  }
}
