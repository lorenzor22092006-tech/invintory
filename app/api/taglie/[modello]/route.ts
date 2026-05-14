import { NextResponse } from 'next/server'
import { readSheet, writeSheet } from '@/lib/sheets'

export async function DELETE(
  _req: Request,
  { params }: { params: { modello: string } }
) {
  try {
    const modelloId = decodeURIComponent(params.modello).trim().toUpperCase()

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