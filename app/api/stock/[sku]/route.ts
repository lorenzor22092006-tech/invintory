import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import type { sheets_v4 } from 'googleapis'
import { deleteVenditeRowsBySku } from '@/lib/sheet-helpers'

const STOCK_TAB = 'STOCK'
const RANGE = `${STOCK_TAB}!A:J`

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getStockSheetId(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<number | null> {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title))',
  })
  const sid = res.data.sheets?.find(
    (s) => s.properties?.title?.toLowerCase() === STOCK_TAB.toLowerCase()
  )?.properties?.sheetId
  return sid ?? null
}

async function findRow(
  spreadsheetId: string,
  targetSku: string
): Promise<{ sheetRow: number; row: string[] } | null> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE,
  })
  const rows = response.data.values
  if (!rows || rows.length < 2) return null
  const want = targetSku.trim().toLowerCase()
  for (let i = 1; i < rows.length; i++) {
    const sku = String(rows[i][0] ?? '').trim()
    if (sku.toLowerCase() === want) {
      const row = rows[i].map((c: unknown) => String(c ?? ''))
      return { sheetRow: i + 1, row }
    }
  }
  return null
}

function rowToItem(row: string[]) {
  return {
    sku: row[0] || '',
    numeroOrdine: row[1] || '',
    dataOrdine: row[2] || '',
    prezzoAcquisto: row[3] || '',
    scadenzaReso: row[4] || '',
    giorniRimanenti:
      row[5] !== '' && row[5] !== undefined ? Number(row[5]) : null,
    statoScadenza: row[6] || '',
    esito: row[7] || '',
    idModello: row[8] || '',
    taglia: row[9] || '',
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await context.params
    const sku = decodeURIComponent(rawSku)
    const found = await findRow(process.env.GOOGLE_SHEET_ID!, sku)
    if (!found) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 })
    }
    return NextResponse.json({ item: rowToItem(found.row) })
  } catch (error) {
    console.error('GET /api/stock/[sku]:', error)
    return NextResponse.json({ error: 'Errore lettura foglio' }, { status: 500 })
  }
}

type PatchBody = {
  numeroOrdine?: string
  dataOrdine?: string
  prezzoAcquisto?: string
  scadenzaReso?: string
  esito?: string
  idModello?: string
  taglia?: string
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await context.params
    const sku = decodeURIComponent(rawSku)
    const body = (await req.json()) as PatchBody

    const spreadsheetId = process.env.GOOGLE_SHEET_ID!
    const found = await findRow(spreadsheetId, sku)
    if (!found) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 })
    }

    const cur = found.row
    const prevEsito = String(cur[7] ?? '').trim()
    const next = [...cur]
    while (next.length < 10) next.push('')

    const apply = (idx: number, v: string | undefined) => {
      if (v !== undefined) next[idx] = v
    }
    apply(1, body.numeroOrdine)
    apply(2, body.dataOrdine)
    apply(3, body.prezzoAcquisto)
    apply(4, body.scadenzaReso)
    apply(7, body.esito)
    apply(8, body.idModello)
    apply(9, body.taglia)

    const newEsito = body.esito !== undefined ? String(body.esito).trim() : prevEsito
    if (prevEsito === 'Venduto' && newEsito === 'In stock') {
      await deleteVenditeRowsBySku(spreadsheetId, String(cur[0] ?? '').trim())
    }

    const row = found.sheetRow
    const b = next[1] ?? ''
    const c = next[2] ?? ''
    const d = next[3] ?? ''
    const e = next[4] ?? ''
    const h = next[7] ?? ''
    const i = next[8] ?? ''
    const j = next[9] ?? ''

    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `${STOCK_TAB}!B${row}:E${row}`, values: [[b, c, d, e]] },
          { range: `${STOCK_TAB}!H${row}:J${row}`, values: [[h, i, j]] },
        ],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/stock/[sku]:', error)
    return NextResponse.json({ error: 'Errore aggiornamento foglio' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await context.params
    const sku = decodeURIComponent(rawSku)
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!

    const found = await findRow(spreadsheetId, sku)
    if (!found) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 })
    }

    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const sheetId = await getStockSheetId(sheets, spreadsheetId)
    if (sheetId == null) {
      return NextResponse.json(
        { error: `Foglio "${STOCK_TAB}" non trovato` },
        { status: 500 }
      )
    }

    const startIndex = found.sheetRow - 1
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex,
                endIndex: startIndex + 1,
              },
            },
          },
        ],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/stock/[sku]:', error)
    return NextResponse.json({ error: 'Errore eliminazione riga' }, { status: 500 })
  }
}
