import { NextResponse } from 'next/server'
import { supabase, parseEuro } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vendite')
      .select('*')
      .order('id')

    if (error) throw error

    const vendite = (data || []).map((row) => ({
      sku: row.sku || '',
      idModello: row.id_modello || '',
      taglia: row.taglia || '',
      dataVendita: row.data_vendita || '',
      prezzoAcquisto: Number(row.prezzo_acquisto) || 0,
      prezzoVendita: Number(row.prezzo_vendita) || 0,
      guadagnoLordo: Number(row.guadagno_lordo) || 0,
      venditore: row.venditore || '',
      fee: Number(row.fee) || 0,
      guadagnoNetto: Number(row.guadagno_netto) || 0,
    }))

    return NextResponse.json(vendite)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura vendite' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const skuRaw = String(body.sku ?? '').trim()
    const prezzoVendita =
      typeof body.prezzoVendita === 'number'
        ? body.prezzoVendita
        : parseFloat(String(body.prezzoVendita ?? '').replace(',', '.')) || 0
    const dataVenditaRaw = String(body.dataVendita ?? '').trim()
    const venditore = String(body.venditore ?? '').trim()

    if (!skuRaw) return NextResponse.json({ error: 'SKU obbligatorio' }, { status: 400 })
    if (!prezzoVendita || prezzoVendita <= 0)
      return NextResponse.json({ error: 'Prezzo vendita non valido' }, { status: 400 })
    if (!dataVenditaRaw)
      return NextResponse.json({ error: 'Data vendita obbligatoria' }, { status: 400 })

    const iso = dataVenditaRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const dataVendita = iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : dataVenditaRaw

    const { data: capo, error: stockError } = await supabase
      .from('stock')
      .select('*')
      .eq('sku', skuRaw)
      .maybeSingle()

    if (stockError) throw stockError
    if (!capo) return NextResponse.json({ error: 'SKU non trovato nello stock' }, { status: 404 })

    const esito = String(capo.esito ?? '').trim()
    if (esito === 'Venduto') return NextResponse.json({ error: 'Capo già venduto' }, { status: 400 })
    if (esito !== 'In stock' && esito !== 'Reso, ma in stock')
      return NextResponse.json({ error: 'Solo i prodotti in stock possono essere venduti' }, { status: 400 })

    let feePerc = 0
    if (venditore) {
      const { data: venditoreDati } = await supabase
        .from('config_venditori')
        .select('fee_percentuale')
        .eq('nome', venditore)
        .maybeSingle()
      feePerc = venditoreDati ? Number(venditoreDati.fee_percentuale) || 0 : 0
    }

    const prezzoAcquisto = parseEuro(String(capo.prezzo_acquisto ?? ''))
    const guadagnoLordo = prezzoVendita - prezzoAcquisto
    const feeEuro = (guadagnoLordo * feePerc) / 100
    const guadagnoNetto = guadagnoLordo - feeEuro

    const { error: insertError } = await supabase.from('vendite').insert({
      sku: capo.sku,
      id_modello: capo.id_modello || '',
      taglia: capo.taglia || '',
      data_vendita: dataVendita,
      prezzo_acquisto: prezzoAcquisto,
      prezzo_vendita: prezzoVendita,
      guadagno_lordo: guadagnoLordo,
      venditore,
      fee: feeEuro,
      guadagno_netto: guadagnoNetto,
      nota: '',
    })
    if (insertError) throw insertError

    const { error: updateError } = await supabase
      .from('stock')
      .update({ esito: 'Venduto' })
      .eq('sku', skuRaw)
    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore registrazione vendita' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const sku = String(body.sku ?? '').trim()
    if (!sku) return NextResponse.json({ error: 'SKU obbligatorio' }, { status: 400 })

    const { data: existing, error: fetchError } = await supabase
      .from('vendite')
      .select('*')
      .eq('sku', sku)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!existing) return NextResponse.json({ error: 'Vendita non trovata' }, { status: 404 })

    const prezzoAcquisto = Number(existing.prezzo_acquisto) || 0
    const finalPrezzoVendita =
      body.prezzoVendita !== undefined
        ? parseFloat(String(body.prezzoVendita).replace(',', '.')) || 0
        : Number(existing.prezzo_vendita) || 0
    const finalVenditore =
      body.venditore !== undefined ? String(body.venditore).trim() : (existing.venditore || '')

    let finalDataVendita = existing.data_vendita || ''
    if (body.dataVendita) {
      const iso = String(body.dataVendita).match(/^(\d{4})-(\d{2})-(\d{2})$/)
      finalDataVendita = iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : String(body.dataVendita)
    }

    let feePerc = 0
    if (finalVenditore) {
      const { data: venditoreDati } = await supabase
        .from('config_venditori')
        .select('fee_percentuale')
        .eq('nome', finalVenditore)
        .maybeSingle()
      feePerc = venditoreDati ? Number(venditoreDati.fee_percentuale) || 0 : 0
    }

    const guadagnoLordo = finalPrezzoVendita - prezzoAcquisto
    const feeEuro = (guadagnoLordo * feePerc) / 100
    const guadagnoNetto = guadagnoLordo - feeEuro

    const { error } = await supabase
      .from('vendite')
      .update({
        data_vendita: finalDataVendita,
        prezzo_vendita: finalPrezzoVendita,
        guadagno_lordo: guadagnoLordo,
        venditore: finalVenditore,
        fee: feeEuro,
        guadagno_netto: guadagnoNetto,
      })
      .eq('sku', sku)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/vendite:', error)
    return NextResponse.json({ error: 'Errore modifica vendita' }, { status: 500 })
  }
}
