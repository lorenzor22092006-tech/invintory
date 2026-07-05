import { NextResponse } from 'next/server'
import { requireCeo } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demo'
import { demoConfig, demoTaglieItems } from '@/lib/demo-data'

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ venditori: demoConfig.venditori, categorie: demoConfig.categorie })
  }

  try {
    const [{ data: venditori }, { data: categorie }] = await Promise.all([
      supabase.from('config_venditori').select('*').order('nome'),
      supabase.from('config_categorie').select('*').order('nome'),
    ])

    return NextResponse.json({
      venditori: (venditori || []).map((r) => ({
        nome: r.nome || '',
        feePercentuale: Number(r.fee_percentuale) || 0,
      })),
      categorie: (categorie || []).map((r) => r.nome),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await requireCeo())) return NextResponse.json({ error: 'Operazione riservata al CEO' }, { status: 403 })

  try {
    const { tipo, valore, fee } = await request.json()

    if (tipo === 'venditore') {
      const nome = String(valore ?? '').trim()
      if (!nome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })

      const { data: existing } = await supabase
        .from('config_venditori')
        .select('nome')
        .ilike('nome', nome)
        .maybeSingle()
      if (existing) return NextResponse.json({ error: 'Venditore già presente' }, { status: 400 })

      const { error } = await supabase.from('config_venditori').insert({ nome, fee_percentuale: fee ?? 0 })
      if (error) throw error
    } else if (tipo === 'categoria') {
      const nome = String(valore ?? '').trim()
      if (!nome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })

      const { data: existing } = await supabase
        .from('config_categorie')
        .select('nome')
        .ilike('nome', nome)
        .maybeSingle()
      if (existing) return NextResponse.json({ error: 'Categoria già presente' }, { status: 400 })

      const { error } = await supabase.from('config_categorie').insert({ nome })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore salvataggio config' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!(await requireCeo())) return NextResponse.json({ error: 'Operazione riservata al CEO' }, { status: 403 })

  try {
    const body = await request.json()
    const { tipo, nomeOriginale, nome, fee } = body

    if (tipo === 'venditore') {
      const newNome = nome !== undefined ? String(nome).trim() : String(nomeOriginale ?? '').trim()
      if (!newNome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
      const newFee = fee !== undefined ? Number(fee) : undefined

      const updates: Record<string, unknown> = { nome: newNome }
      if (newFee !== undefined) updates.fee_percentuale = newFee

      const { error } = await supabase
        .from('config_venditori')
        .update(updates)
        .eq('nome', String(nomeOriginale ?? '').trim())
      if (error) throw error
    } else if (tipo === 'categoria') {
      const newNome = String(nome ?? '').trim()
      if (!newNome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
      const { error } = await supabase
        .from('config_categorie')
        .update({ nome: newNome })
        .eq('nome', String(nomeOriginale ?? '').trim())
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore modifica config' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await requireCeo())) return NextResponse.json({ error: 'Operazione riservata al CEO' }, { status: 403 })

  try {
    const body = await request.json()
    const { tipo, nome } = body

    if (tipo === 'venditore') {
      const { error } = await supabase
        .from('config_venditori')
        .delete()
        .eq('nome', String(nome ?? '').trim())
      if (error) throw error
    } else if (tipo === 'categoria') {
      const { error } = await supabase
        .from('config_categorie')
        .delete()
        .eq('nome', String(nome ?? '').trim())
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore eliminazione config' }, { status: 500 })
  }
}
