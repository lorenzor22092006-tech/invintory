import { NextResponse } from 'next/server'
import { readSheet, writeSheet } from '@/lib/sheets'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ modello: string }> }
) {
  try {
    const { modello } = await params
    const modelloId = decodeURIComponent(modello).trim().toUpperCase()
    const body = await req.json()
    const fotoUrl = String(body.fotoUrl ?? '').trim()

    const rows = await readSheet('TAGLIE_STOCK!A2:C5000')
    const rowIndex = rows.findIndex(
      (r) => String(r[0] ?? '').trim().toUpperCase() === modelloId
    )

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Modello non trovato' }, { status: 404 })
    }

    const sheetRow = rowIndex + 2
    const categoria = String(rows[rowIndex][1] ?? '').trim()

    await writeSheet(`TAGLIE_STOCK!A${sheetRow}:C${sheetRow}`, [
      [modelloId, categoria, fotoUrl],
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/taglie/[modello]:', error)
    return NextResponse.json({ error: 'Errore aggiornamento foto' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ modello: string }> }
) {
  try {
    const { modello } = await params
    const modelloId = decodeURIComponent(modello).trim().toUpperCase()

    const rows = await readSheet('TAGLIE_STOCK!A2:A5000')
    const rowIndex = rows.findIndex(
      (r) => String(r[0] ?? '').trim().toUpperCase() === modelloId
    )

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Modello non trovato' }, { status: 404 })
    }

    const sheetRow = rowIndex + 2

    await writeSheet(`TAGLIE_STOCK!A${sheetRow}:O${sheetRow}`, [
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/taglie/[modello]:', error)
    return NextResponse.json({ error: 'Errore eliminazione modello' }, { status: 500 })
  }
}