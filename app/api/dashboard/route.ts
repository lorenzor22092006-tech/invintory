import { NextResponse } from 'next/server'
import { readSheet } from '@/lib/sheets'
import { KpiDashboard } from '@/lib/types'

function parseEuro(val: string): number {
  return parseFloat(String(val).replace('€', '').replace(',', '.').trim()) || 0
}

export async function GET() {
  try {
    const vendite = await readSheet('VENDITE!A2:J')
    const stock = await readSheet('STOCK!A2:J')

    const totaleStock = stock.filter((r) => r[7] === 'In stock').length
    const totaleVenduti = stock.filter((r) => r[7] === 'Venduto').length
    const totaleResi = stock.filter((r) => r[7] === 'Reso').length

    const scadenzeImminenti = stock.filter((r) => {
      if (r[7] !== 'In stock') return false
      const giorni = parseInt(r[5])
      return !isNaN(giorni) && giorni > 0 && giorni <= 15
    }).length

    const scaduti = stock.filter((r) => {
      if (r[7] !== 'In stock') return false
      const giorni = parseInt(r[5])
      return !isNaN(giorni) && giorni <= 0
    }).length

    const venditeValide = vendite.filter((r) => r[0])

    const fatturato = venditeValide.reduce((sum, row) => sum + parseEuro(row[5]), 0)
    const costoAcquisti = venditeValide.reduce((sum, row) => sum + parseEuro(row[4]), 0)
    const guadagnoLordo = venditeValide.reduce((sum, row) => sum + parseEuro(row[6]), 0)
    const feeTotali = venditeValide.reduce((sum, row) => sum + parseEuro(row[8]), 0)
    const guadagnoNetto = venditeValide.reduce((sum, row) => sum + parseEuro(row[9]), 0)

    const capiInStock = stock.filter((r) => r[7] === 'In stock')
    const rimanenze = capiInStock.reduce((sum, row) => sum + parseEuro(row[3]), 0)

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