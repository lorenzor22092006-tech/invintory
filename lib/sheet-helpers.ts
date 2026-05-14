import { readSheet } from '@/lib/sheets'
import { google } from 'googleapis'
import type { sheets_v4 } from 'googleapis'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function getSheetIdByTitle(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  title: string
): Promise<number | null> {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title))',
  })
  const want = title.trim().toLowerCase()
  const sid = res.data.sheets?.find(
    (s) => s.properties?.title?.toLowerCase() === want
  )?.properties?.sheetId
  return sid ?? null
}

/**
 * Ultima riga del foglio (1-based) in cui la colonna ha un valore non vuoto,
 * cercando da startRow a endRow inclusi.
 */
export async function findLastUsedRowInColumn(
  sheetName: string,
  columnLetter: string,
  startRow: number,
  endRow: number
): Promise<number> {
  const range = `${sheetName}!${columnLetter}${startRow}:${columnLetter}${endRow}`
  const values = await readSheet(range)
  let last = startRow - 1
  for (let i = 0; i < values.length; i++) {
    const cell = String(values[i]?.[0] ?? '').trim()
    if (cell) last = startRow + i
  }
  return last
}

/** Prossima riga libera subito sotto l'ultima con SKU (riga 1 = intestazioni). */
export async function nextRowAfterLastSku(
  sheetName: string,
  columnLetter = 'A',
  startRow = 2,
  endRow = 5000
): Promise<number> {
  const last = await findLastUsedRowInColumn(sheetName, columnLetter, startRow, endRow)
  return last < startRow ? startRow : last + 1
}

/**
 * Elimina dal foglio VENDITE tutte le righe il cui SKU (colonna A) coincide con targetSku.
 * Elimina dall'indice più alto per non sfalsare gli indici.
 */
export async function deleteVenditeRowsBySku(spreadsheetId: string, targetSku: string): Promise<void> {
  const want = targetSku.trim().toLowerCase()
  if (!want) return

  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetId = await getSheetIdByTitle(sheets, spreadsheetId, 'VENDITE')
  if (sheetId == null) return

  const col = await readSheet(`VENDITE!A2:A5000`)
  const rows1Based: number[] = []
  for (let i = 0; i < col.length; i++) {
    const sku = String(col[i]?.[0] ?? '').trim().toLowerCase()
    if (sku === want) rows1Based.push(i + 2)
  }
  if (rows1Based.length === 0) return

  rows1Based.sort((a, b) => b - a)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: rows1Based.map((sheetRow) => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: sheetRow - 1,
            endIndex: sheetRow,
          },
        },
      })),
    },
  })
}
