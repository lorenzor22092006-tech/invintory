import { NextResponse } from 'next/server'
import { readSheet, appendSheet } from '@/lib/sheets'

export async function GET() {
  try {
    const [catalogRows, stockRows, configCatRows] = await Promise.all([
      readSheet('TAGLIE_STOCK!A2:C5000'),
      readSheet('STOCK!A2:J5000'),
      readSheet('CONFIG!D2:D'),
    ])

    // Build index: idModello → taglia → SKU[]
    const stockIndex: Record<string, Record<string, string[]>> = {}
    for (const row of stockRows) {
      const sku = String(row[0] ?? '').trim()
      const esito = String(row[7] ?? '').trim()
      const idModello = String(row[8] ?? '').trim().toUpperCase()
      const taglia = String(row[9] ?? '').trim().toUpperCase()

      if (esito !== 'In stock' || !idModello || !sku) continue

      if (!stockIndex[idModello]) stockIndex[idModello] = {}
      if (!stockIndex[idModello][taglia]) stockIndex[idModello][taglia] = []
      stockIndex[idModello][taglia].push(sku)
    }

    const categorieSet = new Set<string>()
    const items = []

    for (const row of catalogRows) {
      const idModello = String(row[0] ?? '').trim()
      if (!idModello) continue

      const categoria = String(row[1] ?? '').trim()
      const fotoUrl = String(row[2] ?? '').trim()

      if (categoria) categorieSet.add(categoria)

      const modelloStock = stockIndex[idModello.toUpperCase()] || {}
      const xsSkus = modelloStock['XS'] || []
      const sSkus = modelloStock['S'] || []
      const mSkus = modelloStock['M'] || []
      const lSkus = modelloStock['L'] || []

      items.push({
        idModello,
        categoria,
        fotoUrl,
        xsStock: xsSkus.length,
        sStock: sSkus.length,
        mStock: mSkus.length,
        lStock: lSkus.length,
        skuXS: xsSkus.join('; '),
        skuS: sSkus.join('; '),
        skuM: mSkus.join('; '),
        skuL: lSkus.join('; '),
      })
    }

    // Merge categories from CONFIG so newly added ones appear immediately
    for (const row of configCatRows) {
      const cat = String(row[0] ?? '').trim()
      if (cat) categorieSet.add(cat)
    }

    return NextResponse.json({
      items,
      categorie: Array.from(categorieSet).sort(),
    })
  } catch (error) {
    console.error('GET /api/taglie:', error)
    return NextResponse.json({ error: 'Errore lettura taglie' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const idModello = String(body.idModello ?? '').trim().toUpperCase()
    const categoria = String(body.categoria ?? '').trim()
    const fotoUrl = String(body.fotoUrl ?? '').trim()

    if (!idModello || !categoria) {
      return NextResponse.json(
        { error: 'ID Modello e Categoria sono obbligatori' },
        { status: 400 }
      )
    }

    const existing = await readSheet('TAGLIE_STOCK!A2:A5000')
    const taken = existing.some(
      (r) => String(r[0] ?? '').trim().toUpperCase() === idModello
    )
    if (taken) {
      return NextResponse.json(
        { error: 'Modello già presente nel catalogo' },
        { status: 400 }
      )
    }

    await appendSheet('TAGLIE_STOCK!A:C', [[idModello, categoria, fotoUrl]])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/taglie:', error)
    return NextResponse.json({ error: 'Errore creazione modello' }, { status: 500 })
  }
}
