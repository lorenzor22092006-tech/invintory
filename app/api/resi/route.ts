import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const skus: string[] = (body.skus ?? []).map((s: unknown) => String(s).trim()).filter(Boolean)

    if (skus.length === 0) {
      return NextResponse.json({ error: 'Inserisci almeno uno SKU' }, { status: 400 })
    }

    const risultati: { sku: string; ok: boolean; errore?: string }[] = []

    for (const sku of skus) {
      const { data: capo, error } = await supabase
        .from('stock')
        .select('sku, esito')
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
      } else {
        risultati.push({ sku, ok: true })
      }
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
