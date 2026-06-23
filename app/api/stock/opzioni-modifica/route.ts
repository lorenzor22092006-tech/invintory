import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TAGLIE_BASE = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

function mergeTaglie(dalDB: string[]): string[] {
  const set = new Set<string>()
  for (const t of TAGLIE_BASE) set.add(t)
  for (const raw of dalDB) {
    const t = String(raw ?? '').trim()
    if (t) set.add(t)
  }
  const all = Array.from(set)
  all.sort((a, b) => {
    const ia = TAGLIE_BASE.indexOf(a as (typeof TAGLIE_BASE)[number])
    const ib = TAGLIE_BASE.indexOf(b as (typeof TAGLIE_BASE)[number])
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b, 'it', { numeric: true })
  })
  return all
}

export async function GET() {
  try {
    const [{ data: stockTaglie }, { data: modelli }] = await Promise.all([
      supabase.from('stock').select('taglia'),
      supabase.from('taglie_stock').select('id_modello').order('id_modello'),
    ])

    const taglie = mergeTaglie((stockTaglie || []).map((r) => r.taglia || ''))
    const idModelli = Array.from(
      new Set((modelli || []).map((r) => (r.id_modello || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'it'))

    return NextResponse.json({ idModelli, taglie })
  } catch (error) {
    console.error('opzioni-modifica:', error)
    return NextResponse.json({ error: 'Errore lettura opzioni' }, { status: 500 })
  }
}
