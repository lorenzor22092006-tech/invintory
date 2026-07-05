import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireCeo, generatePassword } from '@/lib/auth'

/** Crea (o rigenera) le credenziali di accesso per un venditore.
    Solo il CEO può farlo. La password viene mostrata una volta sola. */
export async function POST(request: Request) {
  const ceo = await requireCeo()
  if (!ceo) return NextResponse.json({ error: 'Operazione riservata al CEO' }, { status: 403 })

  try {
    const body = await request.json()
    const nome = String(body.nome ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()

    if (!nome) return NextResponse.json({ error: 'Nome venditore obbligatorio' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 })
    }

    // Il venditore deve esistere in config
    const { data: venditore } = await supabase
      .from('config_venditori')
      .select('nome')
      .ilike('nome', nome)
      .maybeSingle()
    if (!venditore) {
      return NextResponse.json({ error: 'Venditore non trovato' }, { status: 404 })
    }

    const password = generatePassword()
    const metadata = { venditore: venditore.nome, role: 'venditore' }

    // Prova a creare l'account; se l'email esiste già, rigenera la password
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (createError) {
      const already =
        createError.message?.toLowerCase().includes('already') ||
        createError.status === 422
      if (!already) {
        return NextResponse.json({ error: `Errore creazione account: ${createError.message}` }, { status: 500 })
      }
      // account esistente → trova l'utente e aggiorna password + metadata
      const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      if (listError) {
        return NextResponse.json({ error: 'Errore ricerca account esistente' }, { status: 500 })
      }
      const user = list.users.find((u) => (u.email || '').toLowerCase() === email)
      if (!user) {
        return NextResponse.json({ error: 'Account esistente ma non trovato' }, { status: 500 })
      }
      const { error: updError } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        user_metadata: metadata,
      })
      if (updError) {
        return NextResponse.json({ error: `Errore aggiornamento account: ${updError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, email, password, nome: venditore.nome })
  } catch {
    return NextResponse.json({ error: 'Errore generazione credenziali' }, { status: 500 })
  }
}
