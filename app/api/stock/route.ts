import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { readSheet, writeSheet } from '@/lib/sheets'
import { nextRowAfterLastSku } from '@/lib/sheet-helpers'

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'STOCK!A:J', // SKU … Taglia
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ items: [] })
    }

    // Skip header row (index 0)
    const items = rows.slice(1).map((row) => ({
      sku: row[0] || '',
      numeroOrdine: row[1] || '',
      dataOrdine: row[2] || '',
      prezzoAcquisto: row[3] || '',
      scadenzaReso: row[4] || '',
      giorniRimanenti: (() => { const g = Number(row[5]); return row[5] !== '' && row[5] !== undefined && !isNaN(g) ? g : null })(),
      statoScadenza: row[6] || '',
      esito: row[7] || '',
      idModello: row[8] || '',
      taglia: row[9] || '',
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Google Sheets error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

type NuovoStockBody = {
  sku: string
  numeroOrdine: string
  dataOrdine: string
  prezzoAcquisto: string
  idModello: string
  taglia: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NuovoStockBody
    const sku = String(body.sku ?? '').trim()
    const numeroOrdine = String(body.numeroOrdine ?? '').trim()
    const dataOrdine = String(body.dataOrdine ?? '').trim()
    const prezzoAcquisto = String(body.prezzoAcquisto ?? '').trim()
    const idModello = String(body.idModello ?? '').trim()
    const taglia = String(body.taglia ?? '').trim()

    if (!sku || !numeroOrdine || !dataOrdine || !prezzoAcquisto || !idModello || !taglia) {
      return NextResponse.json({ error: 'Compila tutti i campi obbligatori' }, { status: 400 })
    }

    const existing = await readSheet('STOCK!A2:A5000')
    const taken = existing.some(
      (r) => String(r[0] ?? '').trim().toLowerCase() === sku.toLowerCase()
    )
    if (taken) {
      return NextResponse.json({ error: 'SKU già presente nello stock' }, { status: 400 })
    }

    const nextRow = await nextRowAfterLastSku('STOCK', 'A', 2, 8000)

    // Scrivi A-D (SKU, N.Ordine, Data, Prezzo) — NON toccare E, F, G (formule)
    await writeSheet(`STOCK!A${nextRow}:D${nextRow}`, [
      [sku, numeroOrdine, dataOrdine, prezzoAcquisto],
    ])

    // Scrivi H-J (Esito, ID Modello, Taglia) separatamente
    await writeSheet(`STOCK!H${nextRow}:J${nextRow}`, [
      ['In stock', idModello, taglia],
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/stock:', error)
    return NextResponse.json({ error: 'Errore creazione riga stock' }, { status: 500 })
  }
}