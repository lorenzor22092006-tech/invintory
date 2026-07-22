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
    const [
      { data: vendite, error: vErr },
      { data: venditeSub, error: sErr },
      { data: pagamenti, error: pErr },
    ] = await Promise.all([
      supabase.from('vendite').select('prezzo_vendita, fee, guadagno_netto').eq('venditore', nome),
      // vendite dei sub-venditori di cui questo utente è capo: gli spetta fee_capo
      supabase.from('vendite').select('fee_capo').eq('capo', nome),
      supabase.from('pagamenti_venditori').select('importo').eq('venditore', nome),
    ])
    if (vErr) throw vErr
    if (sErr) throw sErr
    if (pErr) throw pErr

    const round = (n: number) => Math.round(n * 100) / 100
    const numVendite = (vendite || []).length
    const fatturato = round((vendite || []).reduce((s, v) => s + (Number(v.prezzo_vendita) || 0), 0))
    // "soldi guadagnati" = commissioni proprie (fee) + eventuale quota da capo sulle vendite dei sub (fee_capo).
    // Fuso in un unico totale: nessuna voce "capo/sub" mostrata in dashboard.
    const feeProprie = (vendite || []).reduce((s, v) => s + (Number(v.fee) || 0), 0)
    const feeDaSub = (venditeSub || []).reduce((s, v) => s + (Number(v.fee_capo) || 0), 0)
    const guadagnato = round(feeProprie + feeDaSub)
    const mandato = round((pagamenti || []).reduce((s, p) => s + (Number(p.importo) || 0), 0))
    const daRicevere = round(guadagnato - mandato)

    return NextResponse.json({ nome, numVendite, fatturato, guadagnato, mandato, daRicevere })
  } catch {
    return NextResponse.json({ error: 'Errore lettura bilancio' }, { status: 500 })
  }
}
