import { NextResponse } from 'next/server'
import { readSheet, appendSheet, writeSheet } from '@/lib/sheets'
import { Venditore } from '@/lib/types'

export async function GET() {
  try {
    const venditori = await readSheet('CONFIG!A2:B')
    const categorie = await readSheet('CONFIG!D2:D')

    return NextResponse.json({
      venditori: venditori.map((row) => ({
        nome: row[0] || '',
        feePercentuale: parseFloat(row[1]) || 0,
      })),
      categorie: categorie.map((row) => row[0] || ''),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { tipo, valore, fee } = await request.json()

    if (tipo === 'venditore') {
      const rows = await readSheet('CONFIG!A2:B')
      const nextRow = rows.length + 2
      await writeSheet(`CONFIG!A${nextRow}:B${nextRow}`, [[valore, fee || 0]])
    } else if (tipo === 'categoria') {
      const rows = await readSheet('CONFIG!D2:D')
      const nextRow = rows.length + 2
      await writeSheet(`CONFIG!D${nextRow}`, [[valore]])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore salvataggio config' }, { status: 500 })
  }
}
