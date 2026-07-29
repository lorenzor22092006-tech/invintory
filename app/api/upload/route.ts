import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'jpg',
  'image/heif': 'jpg',
}
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const modelloId = String(formData.get('modelloId') ?? 'foto').trim()

    if (!file) {
      return NextResponse.json({ error: 'Nessun file' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File troppo grande (max 5MB)' }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Formato immagine non supportato' }, { status: 400 })
    }
    const contentType = file.type === 'image/heic' || file.type === 'image/heif' ? 'image/jpeg' : file.type

    const safeModello = modelloId
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase() || 'foto'
    const filename = `${safeModello}_${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from('modelli')
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('modelli')
      .getPublicUrl(filename)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Errore durante il caricamento' }, { status: 500 })
  }
}
