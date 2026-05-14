import { NextResponse } from 'next/server'
import { readSheet, writeSheet } from '@/lib/sheets'
import { Vendita } from '@/lib/types'
import { buildVenditeFixedRow, parseVenditeFixedRow } from '@/lib/vendite-fixed-row'
import { nextRowAfterLastSku } from '@/lib/sheet-helpers'

const VENDITE_DATA_START = 2
const VENDITE_DATA_END = 5000

function parseEuro(val: string): number {
  return parseFloat(String(val).replace('€', '').replace(',', '.').trim()) || 0
}

export async function GET() {
  try {
    const dataRows = await readSheet(`VENDITE!A${VENDITE_DATA_START}:K${VENDITE_DATA_END}`)
    const vendite: Vendita[] = dataRows
      .map((row) => parseVenditeFixedRow(row.map((c) => String(c ?? ''))))
      .filter((parsed) => parsed.sku.trim())
      .map((parsed) => ({
        sku: parsed.sku,
        idModello: parsed.idModello,
        taglia: parsed.taglia,
        dataVendita: parsed.dataVendita,
        prezzoAcquisto: parseEuro(parsed.prezzoAcquisto),
        prezzoVendita: parseEuro(parsed.prezzoVendita),
        guadagnoLordo: parseEuro(parsed.guadagnoLordo),
        venditore: parsed.venditore,
        fee: parseEuro(parsed.fee),
        guadagnoNetto: parseEuro(parsed.guadagnoNetto),
      }))
    return NextResponse.json(vendite)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura vendite' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const skuRaw = String(body.sku ?? '').trim()
    const prezzoVendita =
      typeof body.prezzoVendita === 'number'
        ? body.prezzoVendita
        : parseFloat(String(body.prezzoVendita ?? '').replace(',', '.')) || 0
    const dataVenditaRaw = String(body.dataVendita ?? '').trim()
    const venditore = String(body.venditore ?? '').trim()

    if (!skuRaw) {
      return NextResponse.json({ error: 'SKU obbligatorio' }, { status: 400 })
    }
    if (!prezzoVendita || prezzoVendita <= 0) {
      return NextResponse.json({ error: 'Prezzo vendita non valido' }, { status: 400 })
    }
    if (!dataVenditaRaw) {
      return NextResponse.json({ error: 'Data vendita obbligatoria' }, { status: 400 })
    }

    const iso = dataVenditaRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const dataVendita = iso
      ? `${iso[3]}/${iso[2]}/${iso[1]}`
      : dataVenditaRaw

    const stockRows = await readSheet('STOCK!A2:J')
    const capo = stockRows.find(
      (row) => String(row[0] ?? '').trim().toLowerCase() === skuRaw.toLowerCase()
    )
    if (!capo) {
      return NextResponse.json({ error: 'SKU non trovato nello stock' }, { status: 404 })
    }
    const esito = String(capo[7] ?? '').trim()
    if (esito === 'Venduto') {
      return NextResponse.json({ error: 'Capo già venduto' }, { status: 400 })
    }
    if (esito !== 'In stock') {
      return NextResponse.json(
        { error: 'Solo i prodotti "In stock" possono essere venduti' },
        { status: 400 }
      )
    }

    const sku = String(capo[0] ?? '').trim()

    const configRows = await readSheet('CONFIG!A2:B')
    const venditoreDati = venditore
      ? configRows.find((row) => String(row[0] ?? '').trim() === venditore)
      : undefined
    const feePerc = venditoreDati
      ? parseFloat(String(venditoreDati[1]).replace('%', '')) || 0
      : 0
    const prezzoAcquisto = parseEuro(capo[3])
    const feeEuro = (prezzoVendita * feePerc) / 100
    const guadagnoLordo = prezzoVendita - prezzoAcquisto
    const guadagnoNetto = guadagnoLordo - feeEuro

    const row = buildVenditeFixedRow({
      sku,
      idModello: String(capo[8] ?? ''),
      taglia: String(capo[9] ?? ''),
      dataVendita,
      prezzoAcquisto,
      prezzoVendita,
      guadagnoLordo,
      venditore,
      fee: feeEuro,
      guadagnoNetto,
    })

    const nextRow = await nextRowAfterLastSku(
      'VENDITE',
      'A',
      VENDITE_DATA_START,
      VENDITE_DATA_END
    )
    await writeSheet(`VENDITE!A${nextRow}:K${nextRow}`, [row])

    const rowIndex = stockRows.findIndex(
      (row) => String(row[0] ?? '').trim().toLowerCase() === skuRaw.toLowerCase()
    )
    const sheetRow = rowIndex + 2
    await writeSheet(`STOCK!H${sheetRow}`, [['Venduto']])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore registrazione vendita' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const sku = String(body.sku ?? '').trim()
    if (!sku) return NextResponse.json({ error: 'SKU obbligatorio' }, { status: 400 })

    const rows = await readSheet(`VENDITE!A${VENDITE_DATA_START}:K${VENDITE_DATA_END}`)
    const rowIndex = rows.findIndex(
      (r) => String(r[0] ?? '').trim().toLowerCase() === sku.toLowerCase()
    )
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Vendita non trovata' }, { status: 404 })
    }

    const sheetRow = rowIndex + VENDITE_DATA_START
    const parsed = parseVenditeFixedRow(rows[rowIndex].map((c) => String(c ?? '')))

    const prezzoAcquisto = parseEuro(parsed.prezzoAcquisto)
    const finalPrezzoVendita =
      body.prezzoVendita !== undefined
        ? parseFloat(String(body.prezzoVendita).replace(',', '.')) || 0
        : parseEuro(parsed.prezzoVendita)
    const finalVenditore =
      body.venditore !== undefined ? String(body.venditore).trim() : parsed.venditore

    let finalDataVendita = parsed.dataVendita
    if (body.dataVendita) {
      const iso = String(body.dataVendita).match(/^(\d{4})-(\d{2})-(\d{2})$/)
      finalDataVendita = iso
        ? `${iso[3]}/${iso[2]}/${iso[1]}`
        : String(body.dataVendita)
    }

    let feePerc = 0
    if (finalVenditore) {
      const configRows = await readSheet('CONFIG!A2:B')
      const venditoreDati = configRows.find(
        (r) => String(r[0] ?? '').trim() === finalVenditore
      )
      feePerc = venditoreDati
        ? parseFloat(String(venditoreDati[1]).replace('%', '')) || 0
        : 0
    }

    const guadagnoLordo = finalPrezzoVendita - prezzoAcquisto
    const feeEuro = (finalPrezzoVendita * feePerc) / 100
    const guadagnoNetto = guadagnoLordo - feeEuro

    const updatedRow = buildVenditeFixedRow({
      sku: parsed.sku,
      idModello: parsed.idModello,
      taglia: parsed.taglia,
      dataVendita: finalDataVendita,
      prezzoAcquisto,
      prezzoVendita: finalPrezzoVendita,
      guadagnoLordo,
      venditore: finalVenditore,
      fee: feeEuro,
      guadagnoNetto,
    })

    await writeSheet(`VENDITE!A${sheetRow}:K${sheetRow}`, [updatedRow])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/vendite:', error)
    return NextResponse.json({ error: 'Errore modifica vendita' }, { status: 500 })
  }
}
