import { NextResponse } from 'next/server'
import { readSheet } from '@/lib/sheets'
import { KpiDashboard } from '@/lib/types'

export async function GET() {
  try {
    const stock = await readSheet('STOCK!A2:J')
    const vendite = await readSheet('VENDITE!A2:I')
    const config = await readSheet('CONFIG!A2:B')

    const venditori = config.map((row) => ({
      nome: row[0] || '',
      fee: parseFloat(row[1]) || 0,
    }))

    const totaleStock = stock.filter((r) => r[7] === 'In stock').length
    const totaleVenduti = stock.filter((r) => r[7] === 'Venduto').length
    const totaleResi = stock.filter((r) => r[7] === 'Reso').length

    const oggi = new Date()
    const scadenzeImminenti = stock.filter((r) => {
      if (r[7] !== 'In stock') return false
      const giorni = parseInt(r[5])
      return !isNaN(giorni) && giorni >= 0 && giorni <= 7
    }).length

    const fatturato = vendite.reduce((sum, row) => {
      return sum + (parseFloat(row[1]) || 0)
    }, 0)

    const guadagnoNetto = vendite.reduce((sum, row) => {
      const prezzoVendita = parseFloat(row[1]) || 0
      const prezzoAcquisto = parseFloat(row[6]) || 0
      const venditore = row[3] || ''
      const venditoreDati = venditori.find((v) => v.nome === venditore)
      const fee = venditoreDati ? (prezzoVendita * venditoreDati.fee) / 100 : 0
      return sum + prezzoVendita - prezzoAcquisto - fee
    }, 0)

    const kpi: KpiDashboard = {
      totaleStock,
      totaleVenduti,
      totaleResi,
      scadenzeImminenti,
      fatturato: Math.round(fatturato * 100) / 100,
      guadagnoNetto: Math.round(guadagnoNetto * 100) / 100,
    }

    return NextResponse.json(kpi)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura dashboard' }, { status: 500 })
  }
}