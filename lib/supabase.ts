import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

/** Calcola giorni rimanenti da data formato GG/MM/AAAA */
export function computeGiorniRimanenti(scadenzaReso: string): number | null {
  if (!scadenzaReso) return null
  const parts = scadenzaReso.split('/')
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
  if (isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function computeStatoScadenza(giorniRimanenti: number | null): string {
  if (giorniRimanenti === null) return ''
  if (giorniRimanenti < 0) return '🔴 SCADUTO'
  if (giorniRimanenti <= 7) return '🟡 IN SCADENZA'
  return ''
}

export function parseEuro(val: string): number {
  return parseFloat(String(val).replace('€', '').replace(',', '.').trim()) || 0
}
