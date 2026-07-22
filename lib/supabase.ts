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

/** Percentuale sul guadagno lordo che spetta al capo di un sub-venditore
    su ogni vendita del sub. Fissa al 10%. */
export const FEE_CAPO_PERCENTUALE = 10

/** Legge dati fee di un venditore: la sua percentuale e (se sub-venditore) il capo. */
export async function getVenditoreFee(
  nome: string
): Promise<{ feePerc: number; capo: string }> {
  if (!nome) return { feePerc: 0, capo: '' }
  const { data } = await supabase
    .from('config_venditori')
    .select('fee_percentuale, capo')
    .eq('nome', nome)
    .maybeSingle()
  return {
    feePerc: data ? Number(data.fee_percentuale) || 0 : 0,
    capo: data && data.capo ? String(data.capo).trim() : '',
  }
}

/** Calcola le commissioni di una vendita:
    - fee = commissione del venditore (sua % sul guadagno lordo)
    - feeCapo = commissione del capo del sub-venditore (10% sul guadagno lordo), 0 se nessun capo
    - guadagnoNetto = quanto resta al CEO = lordo - fee - feeCapo */
export function computeCommissioni(
  guadagnoLordo: number,
  feePerc: number,
  capo: string
): { fee: number; feeCapo: number; guadagnoNetto: number } {
  const fee = (guadagnoLordo * feePerc) / 100
  const feeCapo = capo ? (guadagnoLordo * FEE_CAPO_PERCENTUALE) / 100 : 0
  const guadagnoNetto = guadagnoLordo - fee - feeCapo
  return { fee, feeCapo, guadagnoNetto }
}
