import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demo'
import { demoCategorie, demoTaglieItems } from '@/lib/demo-data'

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ items: demoTaglieItems, categorie: demoCategorie, demo: true })
  }

  try {
    const [{ data: catalogRows }, { data: stockRows }] = await Promise.all([
      supabase.from('taglie_stock').select('*').order('id_modello'),
      supabase
        .from('stock')
        .select('sku, esito, id_modello, taglia')
        .in('esito', ['In stock', 'Reso, ma in stock']),
    ])

    const stockIndex: Record<string, Record<string, string[]>> = {}
    for (const row of stockRows || []) {
      const sku = (row.sku || '').trim()
      const idModello = (row.id_modello || '').trim().toUpperCase()
      const taglia = (row.taglia || '').trim().toUpperCase()
      if (!idModello || !sku) continue
      if (!stockIndex[idModello]) stockIndex[idModello] = {}
      if (!stockIndex[idModello][taglia]) stockIndex[idModello][taglia] = []
      stockIndex[idModello][taglia].push(sku)
    }

    const categorieSet = new Set<string>()
    const items = []

    for (const row of catalogRows || []) {
      const idModello = (row.id_modello || '').trim()
      if (!idModello) continue

      const categoria = (row.categoria || '').trim()
      const fotoUrl = (row.foto_url || '').trim()
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

    const { data: configCat } = await supabase.from('config_categorie').select('nome')
    for (const row of configCat || []) {
      if (row.nome) categorieSet.add(row.nome)
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

    const { data: existing } = await supabase
      .from('taglie_stock')
      .select('id_modello')
      .eq('id_modello', idModello)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Modello già presente nel catalogo' }, { status: 400 })
    }

    const { error } = await supabase
      .from('taglie_stock')
      .insert({ id_modello: idModello, categoria, foto_url: fotoUrl })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/taglie:', error)
    return NextResponse.json({ error: 'Errore creazione modello' }, { status: 500 })
  }
}
