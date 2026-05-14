import { NextResponse } from 'next/server'
import { readSheet, writeSheet, appendSheet } from '@/lib/sheets'

export async function GET() {
  try {
    const venditori = await readSheet('CONFIG!A2:B')
    const categorie = await readSheet('CONFIG!D2:D')

    return NextResponse.json({
      venditori: venditori
        .filter((row) => row[0])
        .map((row) => ({
          nome: row[0] || '',
          feePercentuale: parseFloat(String(row[1]).replace('%', '').trim()) || 0,
        })),
      categorie: categorie
        .filter((row) => row[0])
        .map((row) => String(row[0])),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { tipo, valore, fee } = await request.json()

    if (tipo === 'venditore') {
      const nome = String(valore ?? '').trim()
      if (!nome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
      const existing = await readSheet('CONFIG!A2:A')
      const taken = existing.some((r) => String(r[0] ?? '').trim().toLowerCase() === nome.toLowerCase())
      if (taken) return NextResponse.json({ error: 'Venditore già presente' }, { status: 400 })
      await appendSheet('CONFIG!A:B', [[nome, fee ?? 0]])
    } else if (tipo === 'categoria') {
      const nome = String(valore ?? '').trim()
      if (!nome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
      const existing = await readSheet('CONFIG!D2:D')
      const taken = existing.some((r) => String(r[0] ?? '').trim().toLowerCase() === nome.toLowerCase())
      if (taken) return NextResponse.json({ error: 'Categoria già presente' }, { status: 400 })
      await appendSheet('CONFIG!D:D', [[nome]])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore salvataggio config' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { tipo, nomeOriginale, nome, fee } = body

    if (tipo === 'venditore') {
      const rows = await readSheet('CONFIG!A2:B')
      const rowIndex = rows.findIndex(
        (r) => String(r[0] ?? '').trim().toLowerCase() === String(nomeOriginale ?? '').trim().toLowerCase()
      )
      if (rowIndex === -1) return NextResponse.json({ error: 'Venditore non trovato' }, { status: 404 })
      const sheetRow = rowIndex + 2
      const newNome = nome !== undefined ? String(nome).trim() : String(rows[rowIndex][0] ?? '').trim()
      const newFee = fee !== undefined ? Number(fee) : parseFloat(String(rows[rowIndex][1] ?? '').replace('%', '')) || 0
      if (!newNome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
      await writeSheet(`CONFIG!A${sheetRow}:B${sheetRow}`, [[newNome, newFee]])
    } else if (tipo === 'categoria') {
      const rows = await readSheet('CONFIG!D2:D')
      const rowIndex = rows.findIndex(
        (r) => String(r[0] ?? '').trim().toLowerCase() === String(nomeOriginale ?? '').trim().toLowerCase()
      )
      if (rowIndex === -1) return NextResponse.json({ error: 'Categoria non trovata' }, { status: 404 })
      const sheetRow = rowIndex + 2
      const newNome = String(nome ?? '').trim()
      if (!newNome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
      await writeSheet(`CONFIG!D${sheetRow}`, [[newNome]])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore modifica config' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { tipo, nome } = body

    if (tipo === 'venditore') {
      const rows = await readSheet('CONFIG!A2:B')
      const rowIndex = rows.findIndex(
        (r) => String(r[0] ?? '').trim().toLowerCase() === String(nome ?? '').trim().toLowerCase()
      )
      if (rowIndex === -1) return NextResponse.json({ error: 'Venditore non trovato' }, { status: 404 })
      await writeSheet(`CONFIG!A${rowIndex + 2}:B${rowIndex + 2}`, [['', '']])
    } else if (tipo === 'categoria') {
      const rows = await readSheet('CONFIG!D2:D')
      const rowIndex = rows.findIndex(
        (r) => String(r[0] ?? '').trim().toLowerCase() === String(nome ?? '').trim().toLowerCase()
      )
      if (rowIndex === -1) return NextResponse.json({ error: 'Categoria non trovata' }, { status: 404 })
      await writeSheet(`CONFIG!D${rowIndex + 2}`, [['']])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore eliminazione config' }, { status: 500 })
  }
}
