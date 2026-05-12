import { NextResponse } from 'next/server'
import { readSheet, appendSheet, writeSheet } from '@/lib/sheets'
import { Vendita } from '@/lib/types'

export async function GET() {
  try {
    const rows = await readSheet('VENDITE!A2:I')
    const vendite: Vendita[] = rows.map((row) => ({
      sku: row[0] || '',
      prezzoVendita: parseFloat(row[1]) || 0,
      dataVendita: row[2] || '',
      venditore: row[3] || '',
      numeroOrdine: row[4] || '',
      dataOrdine: row[5] || '',
      prezzoAcquisto: parseFloat(row[6]) || 0,
      idModello: row[7] || '',
      taglia: row[8] || '',
    }))
    return NextResponse.json(vendite)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura vendite' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { sku, prezzoVendita, dataVendita, venditore } = await request.json()

    const stockRows = await readSheet('STOCK!A2:J')
    const capo = stockRows.find((row) => row[0] === sku)
    if (!capo) {
      return NextResponse.json({ error: 'SKU non trovato nello stock' }, { status: 404 })
    }
    if (capo[7] === 'Venduto') {
      return NextResponse.json({ error: 'Capo già venduto' }, { status: 400 })
    }

    const newVendita = [
      sku,
      prezzoVendita,
      dataVendita,
      venditore || '',
      capo[1] || '',
      capo[2] || '',
      capo[3] || '',
      capo[8] || '',
      capo[9] || '',
    ]
    await appendSheet('VENDITE!A:I', [newVendita])

    const rowIndex = stockRows.findIndex((row) => row[0] === sku)
    const sheetRow = rowIndex + 2
    await writeSheet(`STOCK!H${sheetRow}`, [['Venduto']])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore registrazione vendita' }, { status: 500 })
  }
}