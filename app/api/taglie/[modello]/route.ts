import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ modello: string }> }
) {
  try {
    const { modello } = await params
    const modelloId = decodeURIComponent(modello).trim().toUpperCase()
    const body = await req.json()
    const fotoUrl = String(body.fotoUrl ?? '').trim()

    const { data: existing } = await supabase
      .from('taglie_stock')
      .select('id_modello')
      .eq('id_modello', modelloId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Modello non trovato' }, { status: 404 })
    }

    const { error } = await supabase
      .from('taglie_stock')
      .update({ foto_url: fotoUrl })
      .eq('id_modello', modelloId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/taglie/[modello]:', error)
    return NextResponse.json({ error: 'Errore aggiornamento foto' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ modello: string }> }
) {
  try {
    const { modello } = await params
    const modelloId = decodeURIComponent(modello).trim().toUpperCase()

    const { data: existing } = await supabase
      .from('taglie_stock')
      .select('id_modello')
      .eq('id_modello', modelloId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Modello non trovato' }, { status: 404 })
    }

    const { error } = await supabase
      .from('taglie_stock')
      .delete()
      .eq('id_modello', modelloId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/taglie/[modello]:', error)
    return NextResponse.json({ error: 'Errore eliminazione modello' }, { status: 500 })
  }
}
