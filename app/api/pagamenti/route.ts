import { NextResponse } from 'next/server'
import { readSheet, appendSheet, ensureSheet } from '@/lib/sheets'

const SHEET = 'PAGAMENTI_VENDITORI'
const HEADERS = ['Venditore', 'Importo', 'Data', 'Note']

async function init() {
  await ensureSheet(SHEET, HEADERS)
}

function parseImporto(val: string): number {
  return parseFloat(String(val).replace('€', '').replace(',', '.').trim()) || 0
}

export async function GET() {
  try {
    await init()
    const rows = await readSheet(`${SHEET}!A2:D`)
    const pagamenti = rows
      .filter((r) => String(r[0] ?? '').trim())
      .map((r) => ({
        venditore: String(r[0] ?? '').trim(),
        importo: parseImporto(String(r[1] ?? '')),
        data: String(r[2] ?? '').trim(),
        note: String(r[3] ?? '').trim(),
      }))
    return NextResponse.json(pagamenti)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura pagamenti' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await init()
    const body = await request.json()
    const venditore = String(body.venditore ?? '').trim()
    const importo = parseFloat(String(body.importo ?? '').replace(',', '.')) || 0
    const dataRaw = String(body.data ?? '').trim()
    const nota = String(body.nota ?? '').trim()

    if (!venditore) return NextResponse.json({ error: 'Venditore obbligatorio' }, { status: 400 })
    if (!importo || importo <= 0) return NextResponse.json({ error: 'Importo non valido' }, { status: 400 })
    if (!dataRaw) return NextResponse.json({ error: 'Data obbligatoria' }, { status: 400 })

    const iso = dataRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const data = iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : dataRaw

    await appendSheet(`${SHEET}!A:D`, [[venditore, importo, data, nota]])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore salvataggio pagamento' }, { status: 500 })
  }
}
