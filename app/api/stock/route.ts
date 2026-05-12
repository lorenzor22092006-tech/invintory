import { NextResponse } from 'next/server'
import { readSheet, writeSheet } from '@/lib/sheets'
import { CapoStock } from '@/lib/types'

export async function GET() {
  try {
    const rows = await readSheet('STOCK!A2:J')
    const capi: CapoStock[] = rows.map((row) => ({
      sku: row[0] || '',
      numeroOrdine: row[1] || '',
      dataOrdine: row[2] || '',
      prezzoAcquisto: parseFloat(row[3]) || 0,
      scadenzaReso: row[4] || '',
      giorniRimanenti: parseInt(row[5]) || 0,
      statoScadenza: row[6] || '',
      esito: row[7] || '',
      idModello: row[8] || '',
      taglia: row[9] || '',
    }))
    return NextResponse.json(capi)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura stock' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { sku, field, value } = await request.json()
    const rows = await readSheet('STOCK!A2:J')
    const rowIndex = rows.findIndex((row) => row[0] === sku)
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'SKU non trovato' }, { status: 404 })
    }
    const fieldMap: { [key: string]: number } = {
      sku: 0,
      numeroOrdine: 1,
      dataOrdine: 2,
      prezzoAcquisto: 3,
      esito: 7,
      idModello: 8,
      taglia: 9,
    }
    const colIndex = fieldMap[field]
    if (colIndex === undefined) {
      return NextResponse.json({ error: 'Campo non valido' }, { status: 400 })
    }
    const sheetRow = rowIndex + 2
    const colLetter = String.fromCharCode(65 + colIndex)
    await writeSheet(`STOCK!${colLetter}${sheetRow}`, [[value]])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const capo: CapoStock = await request.json()
    await readSheet('STOCK!A2:J')
    const newRow = [
      capo.sku,
      capo.numeroOrdine,
      capo.dataOrdine,
      capo.prezzoAcquisto,
      '',
      '',
      '',
      'In stock',
      capo.idModello,
      capo.taglia,
    ]
    const rows = await readSheet('STOCK!A2:A')
    const nextRow = rows.length + 2
    await writeSheet(`STOCK!A${nextRow}:J${nextRow}`, [newRow])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore inserimento' }, { status: 500 })
  }
}