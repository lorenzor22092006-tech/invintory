import { NextResponse } from 'next/server'
import { supabase, parseEuro } from '@/lib/supabase'
import { KpiDashboard } from '@/lib/types'

export async function GET() {
  try {
    const [{ data: stock }, { data: vendite }] = await Promise.all([
      supabase.from('stock').select('esito, prezzo_acquisto, scadenza_reso'),
      supabase.from('vendite').select('*'),
    ])

    const stockRows = stock || []
    const venditeRows = vendite || []

    const totaleStock = stockRows.filter((r) => r.esito === 'In stock').length
    const totaleVenduti = stockRows.filter((r) => r.esito === 'Venduto').length
    const totaleResi = stockRows.filter((r) => r.esito === 'Reso').length

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const scadenzeImminenti = stockRows.filter((r) => {
      if (r.esito !== 'In stock') return false
      const parts = (r.scadenza_reso || '').split('/')
      if (parts.length !== 3) return false
      const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      if (isNaN(date.getTime())) return false
      date.setHours(0, 0, 0, 0)
      const giorni = Math.round((date.getTime() - today.getTime()) / 86400000)
      return giorni > 0 && giorni <= 15
    }).length

    const scaduti = stockRows.filter((r) => {
      if (r.esito !== 'In stock') return false
      const parts = (r.scadenza_reso || '').split('/')
      if (parts.length !== 3) return false
      const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      if (isNaN(date.getTime())) return false
      date.setHours(0, 0, 0, 0)
      return date < today
    }).length

    const fatturato = venditeRows.reduce((s, r) => s + (Number(r.prezzo_vendita) || 0), 0)
    const costoAcquisti = venditeRows.reduce((s, r) => s + (Number(r.prezzo_acquisto) || 0), 0)
    const guadagnoLordo = venditeRows.reduce((s, r) => s + (Number(r.guadagno_lordo) || 0), 0)
    const feeTotali = venditeRows.reduce((s, r) => s + (Number(r.fee) || 0), 0)
    const guadagnoNetto = venditeRows.reduce((s, r) => s + (Number(r.guadagno_netto) || 0), 0)

    const rimanenze = stockRows
      .filter((r) => r.esito === 'In stock')
      .reduce((s, r) => s + parseEuro(r.prezzo_acquisto || ''), 0)

    const kpi: KpiDashboard = {
      totaleStock,
      totaleVenduti,
      totaleResi,
      scadenzeImminenti,
      scaduti,
      fatturato: Math.round(fatturato * 100) / 100,
      costoAcquisti: Math.round(costoAcquisti * 100) / 100,
      guadagnoLordo: Math.round(guadagnoLordo * 100) / 100,
      feeTotali: Math.round(feeTotali * 100) / 100,
      guadagnoNetto: Math.round(guadagnoNetto * 100) / 100,
      rimanenze: Math.round(rimanenze * 100) / 100,
    }

    return NextResponse.json(kpi)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura dashboard' }, { status: 500 })
  }
}
