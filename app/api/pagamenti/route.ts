import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pagamenti_venditori')
      .select('*')
      .order('id')

    if (error) throw error

    const pagamenti = (data || []).map((r) => ({
      venditore: r.venditore || '',
      importo: Number(r.importo) || 0,
      data: r.data || '',
      note: r.nota || '',
    }))

    return NextResponse.json(pagamenti)
  } catch (error) {
    return NextResponse.json({ error: 'Errore lettura pagamenti' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const venditore = String(body.venditore ?? '').trim()
    const importo = parseFloat(String(body.importo ?? '').replace(',', '.')) || 0
    const dataRaw = String(body.data ?? '').trim()
    const nota = String(body.nota ?? '').trim()

    if (!venditore) return NextResponse.json({ error: 'Venditore obbligatorio' }, { status: 400 })
    if (!importo || importo <= 0) return NextResponse.json({ error: 'Importo non valido' }, { status: 400 })
    if (!dataRaw) return NextResponse.json({ error: 'Data obbligatoria' }, { status: 400 })

    const iso = dataRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const data = iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : dataRaw

    const { error } = await supabase
      .from('pagamenti_venditori')
      .insert({ venditore, importo, data, nota })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore salvataggio pagamento' }, { status: 500 })
  }
}
