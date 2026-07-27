import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    let fetchUrl: string
    let fetchHeaders: Record<string, string> = {}

    // Foto caricate su Supabase Storage (bucket pubblico "modelli"): passa diretto.
    if (/\.supabase\.co\/storage\/v1\/object\/public\//.test(url)) {
      fetchUrl = url
    } else {
      // Foto storiche su Google Drive: estrai l'ID e usa il thumbnail pubblico.
      let fileId: string | null = null

      // Formato: /file/d/FILE_ID/
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      if (fileMatch) fileId = fileMatch[1]

      // Formato: ?id=FILE_ID o &id=FILE_ID
      if (!fileId) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
        if (idMatch) fileId = idMatch[1]
      }

      if (!fileId) {
        return new NextResponse('URL non consentito', { status: 400 })
      }
      fetchUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
      fetchHeaders = {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://drive.google.com/',
      }
    }

    const response = await fetch(fetchUrl, { headers: fetchHeaders })

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Error fetching image', { status: 500 })
  }
}