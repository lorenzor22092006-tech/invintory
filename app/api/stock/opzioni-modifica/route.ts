import { NextResponse } from 'next/server'
import { readSheet } from '@/lib/sheets'

/** Taglie standard sempre offerte in modifica (anche se non compaiono ancora in STOCK). */
const TAGLIE_BASE = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

function uniqueSorted(values: string[]): string[] {
  const s = new Set(values.map((v) => v.trim()).filter(Boolean))
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'it'))
}

function mergeTaglieDaFoglio(dalFoglio: string[]): string[] {
  const set = new Set<string>()
  for (const t of TAGLIE_BASE) set.add(t)
  for (const raw of dalFoglio) {
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
    const taglieRows = await readSheet('STOCK!J2:J')
    const taglie = mergeTaglieDaFoglio(
      taglieRows.map((row) => String(row[0] ?? ''))
    )

    const modelliRows = await readSheet('TAGLIE_STOCK!A2:A')
    const idModelli = uniqueSorted(
      modelliRows.map((row) => String(row[0] ?? ''))
    )

    return NextResponse.json({ idModelli, taglie })
  } catch (error) {
    console.error('opzioni-modifica:', error)
    return NextResponse.json(
      { error: 'Errore lettura opzioni' },
      { status: 500 }
    )
  }
}
