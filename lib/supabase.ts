import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function initSupabase(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase non configurato: imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }
  _client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
  return _client
}

export function getSupabase(): SupabaseClient {
  if (!_client) return initSupabase()
  return _client
}

/** Client lazy — non crasha al import se mancano le env (demo mode OK) */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
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

/** Calcola scadenza reso (GG/MM/AAAA) = data ordine + 90 giorni */
export function computeScadenzaReso(dataOrdine: string): string {
  if (!dataOrdine) return ''
  const parts = dataOrdine.split('/')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts
  const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
  if (isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + 90)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
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

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
