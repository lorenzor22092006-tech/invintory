import { NextResponse } from 'next/server'
import { readSheet, writeSheet } from '@/lib/sheets'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const skus: string[] = (body.skus ?? []).map((s: unknown) => String(s).trim()).filter(Boolean)

    if (skus.length === 0) {
      return NextResponse.json({ error: 'Inserisci almeno uno SKU' }, { status: 400 })
    }

    const stockRows = await readSheet('STOCK!A2:H')

    const risultati: { sku: string; ok: boolean; errore?: string }[] = []

    for (const sku of skus) {
      const rowIndex = stockRows.findIndex(
        (r) => String(r[0] ?? '').trim().toLowerCase() === sku.toLowerCase()
      )
      if (rowIndex === -1) {
        risultati.push({ sku, ok: false, errore: 'SKU non trovato' })
        continue
      }
      const esito = String(stockRows[rowIndex][7] ?? '').trim()
      if (esito === 'Reso') {
        risultati.push({ sku, ok: false, errore: 'Già segnato come reso' })
        continue
      }
      if (esito === 'Venduto') {
        risultati.push({ sku, ok: false, errore: 'Capo già venduto' })
        continue
      }
      const sheetRow = rowIndex + 2
      await writeSheet(`STOCK!H${sheetRow}`, [['Reso']])
      risultati.push({ sku, ok: true })
    }

    const errori = risultati.filter((r) => !r.ok)
    if (errori.length === skus.length) {
      return NextResponse.json({ error: 'Nessun SKU valido', risultati }, { status: 400 })
    }

    return NextResponse.json({ success: true, risultati })
  } catch (error) {
    return NextResponse.json({ error: 'Errore registrazione resi' }, { status: 500 })
  }
}
