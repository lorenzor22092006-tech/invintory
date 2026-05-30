import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

export async function getSheets() {
  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client as any })
  return sheets
}

export const SHEET_ID = process.env.GOOGLE_SHEET_ID!

export async function readSheet(range: string) {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  })
  return res.data.values || []
}

export async function writeSheet(range: string, values: any[][]) {
  const sheets = await getSheets()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
}

export async function appendSheet(range: string, values: any[][]) {
  const sheets = await getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
}

export async function ensureSheet(title: string, headers: string[]) {
  const sheets = await getSheets()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const exists = meta.data.sheets?.some((s) => s.properties?.title === title)
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    })
  }
}