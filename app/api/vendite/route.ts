import { NextResponse } from 'next/server'
import { supabase, parseEuro, getVenditoreFee, computeCommissioni } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demo'
import { demoVendite } from '@/lib/demo-data'
import { getSession } from '@/lib/auth'

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoVendite)
  }

  try {
    const session = await getSession()
    let query = supabase.from('vendite').select('*').order('id')
    // i venditori vedono solo le proprie vendite
    if (session?.role === 'venditore') {
      query = query.eq('venditore', session.nome)
    }
    const { data, error } = await query

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
      feeCapo: Number(row.fee_capo) || 0,
      capo: row.capo || '',
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
    const session = await getSession()
    // un venditore registra vendite solo a proprio nome
    const venditore =
      session?.role === 'venditore' ? session.nome : String(body.venditore ?? '').trim()

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

    const { feePerc, capo: capoVenditore } = await getVenditoreFee(venditore)

    const prezzoAcquisto = parseEuro(String(capo.prezzo_acquisto ?? ''))
    const guadagnoLordo = prezzoVendita - prezzoAcquisto
    const { fee: feeEuro, feeCapo, guadagnoNetto } = computeCommissioni(
      guadagnoLordo,
      feePerc,
      capoVenditore
    )

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
      fee_capo: feeCapo,
      capo: capoVenditore,
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

    const session = await getSession()
    if (session?.role === 'venditore') {
      if ((existing.venditore || '') !== session.nome) {
        return NextResponse.json({ error: 'Puoi modificare solo le tue vendite' }, { status: 403 })
      }
      // il venditore non può riassegnare la vendita
      body.venditore = undefined
    }

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

    const { feePerc, capo: capoVenditore } = await getVenditoreFee(finalVenditore)

    const guadagnoLordo = finalPrezzoVendita - prezzoAcquisto
    const { fee: feeEuro, feeCapo, guadagnoNetto } = computeCommissioni(
      guadagnoLordo,
      feePerc,
      capoVenditore
    )

    const { error } = await supabase
      .from('vendite')
      .update({
        data_vendita: finalDataVendita,
        prezzo_vendita: finalPrezzoVendita,
        guadagno_lordo: guadagnoLordo,
        venditore: finalVenditore,
        fee: feeEuro,
        fee_capo: feeCapo,
        capo: capoVenditore,
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
