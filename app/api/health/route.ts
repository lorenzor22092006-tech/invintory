import { NextResponse } from 'next/server'
import { hasSupabaseConfig } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demo'

export async function GET() {
  const supabase = hasSupabaseConfig()
  const demoMode = isDemoMode()

  return NextResponse.json({
    ok: supabase || demoMode,
    supabase,
    demoMode,
    message: !supabase && !demoMode
      ? 'Crea .env.local con SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (copia da Vercel → Settings → Environment Variables)'
      : null,
  })
}
