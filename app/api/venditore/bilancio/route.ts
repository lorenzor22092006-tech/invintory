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
      { data: mePreset },
      { data: vendite, error: vErr },
      { data: venditeSub, error: sErr },
      { data: pagamenti, error: pErr },
    ] = await Promise.all([
      supabase.from('config_venditori').select('capo').eq('nome', nome).maybeSingle(),
      supabase.from('vendite').select('prezzo_vendita, fee, guadagno_netto').eq('venditore', nome),
      // vendite dei sub-venditori di cui questo utente è capo: gli spetta fee_capo
      supabase.from('vendite').select('venditore, fee_capo').eq('capo', nome),
      supabase.from('pagamenti_venditori').select('importo').eq('venditore', nome),
    ])
    if (vErr) throw vErr
    if (sErr) throw sErr
    if (pErr) throw pErr

    // sono un sub-venditore se ho un capo assegnato; altrimenti sono "main"
    const isSub = Boolean(mePreset?.capo)

    const round = (n: number) => Math.round(n * 100) / 100
    const numVendite = (vendite || []).length
    // guadagno dalla vendita dei capi (proprie commissioni)
    const guadagnoCapi = round((vendite || []).reduce((s, v) => s + (Number(v.fee) || 0), 0))
    // guadagno dai propri sub-venditori (quota capo sulle loro vendite) — solo per i venditori "main"
    const guadagnoSub = isSub ? 0 : round((venditeSub || []).reduce((s, v) => s + (Number(v.fee_capo) || 0), 0))
    const guadagnato = round(guadagnoCapi + guadagnoSub)
    const mandato = round((pagamenti || []).reduce((s, p) => s + (Number(p.importo) || 0), 0))
    const daRicevere = round(guadagnato - mandato)

    // dettaglio per sub-venditore: nome, numero vendite, guadagno che porta al capo
    let subVenditori: { nome: string; numVendite: number; guadagno: number }[] = []
    if (!isSub) {
      const { data: subConfig } = await supabase.from('config_venditori').select('nome').eq('capo', nome)
      const nomiSub = (subConfig || []).map((r) => r.nome)
      subVenditori = nomiSub.map((subNome) => {
        const righe = (venditeSub || []).filter((v) => v.venditore === subNome)
        return {
          nome: subNome,
          numVendite: righe.length,
          guadagno: round(righe.reduce((s, v) => s + (Number(v.fee_capo) || 0), 0)),
        }
      })
    }

    return NextResponse.json({
      nome, isSub, numVendite, guadagnoCapi, guadagnoSub, guadagnato, mandato, daRicevere, subVenditori,
    })
  } catch {
    return NextResponse.json({ error: 'Errore lettura bilancio' }, { status: 500 })
  }
}
