import { NextResponse } from 'next/server'
import { readSheet } from '@/lib/sheets'
import { ModelloTaglie } from '@/lib/types'

export async function GET() {
  try {
    const rows = await readSheet('TAGLIE_STOCK!A2:L')
    const modelli: ModelloTaglie[] = rows.map((row) => ({
      idModello: row[0] || '',
      categoria: row[1] || '',
      fotoUrl: row[2] || '',
      stockXS: parseInt(row[3]) || 0,
      stockS: parseInt(row[4]) || 0,
      stockM: parseInt(row[5]) || 0,
      stockL: parseInt(row[6]) || 0,
      arrivi: parseInt(row[7]) || 0,
      skuXS: row[8] || '',
      skuS: row[9] || '',
      skuM: row[10] || '',
      skuL: row[11] || '',
    }))
    return NextResponse.json(modelli)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura taglie' }, { status: 500 })
  }
}
