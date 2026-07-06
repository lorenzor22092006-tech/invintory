import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

/** Bilancio personale del venditore loggato: quanto ha guadagnato (commissioni),
    quanto gli è stato mandato, quanto deve ancora ricevere. */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'venditore') {
    return NextResponse.json({ error: 'Riservato ai venditori' }, { status: 403 })
  }

  try {
    const nome = session.nome
    const [{ data: vendite, error: vErr }, { data: pagamenti, error: pErr }] = await Promise.all([
      supabase.from('vendite').select('prezzo_vendita, fee, guadagno_netto').eq('venditore', nome),
      supabase.from('pagamenti_venditori').select('importo').eq('venditore', nome),
    ])
    if (vErr) throw vErr
    if (pErr) throw pErr

    const round = (n: number) => Math.round(n * 100) / 100
    const numVendite = (vendite || []).length
    const fatturato = round((vendite || []).reduce((s, v) => s + (Number(v.prezzo_vendita) || 0), 0))
    // "soldi guadagnati" dal venditore = le sue commissioni (fee)
    const guadagnato = round((vendite || []).reduce((s, v) => s + (Number(v.fee) || 0), 0))
    const mandato = round((pagamenti || []).reduce((s, p) => s + (Number(p.importo) || 0), 0))
    const daRicevere = round(guadagnato - mandato)

    return NextResponse.json({ nome, numVendite, fatturato, guadagnato, mandato, daRicevere })
  } catch {
    return NextResponse.json({ error: 'Errore lettura bilancio' }, { status: 500 })
  }
}
