import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const modelloId = String(formData.get('modelloId') ?? 'foto').trim()

    if (!file) {
      return NextResponse.json({ error: 'Nessun file' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${modelloId.replace(/[^a-zA-Z0-9\-_]/g, '_')}_${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from('modelli')
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('modelli')
      .getPublicUrl(filename)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
