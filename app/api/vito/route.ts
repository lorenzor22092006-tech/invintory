import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'leggi_stock',
      description: 'Legge tutti i prodotti attualmente "In stock". Usalo per rispondere a domande sullo stock disponibile.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cerca_sku',
      description: 'Cerca un prodotto specifico tramite il suo codice SKU e restituisce tutti i dettagli.',
      parameters: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Il codice SKU da cercare' },
        },
        required: ['sku'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'leggi_taglie_modello',
      description: "Vede tutte le taglie e gli SKU disponibili per un dato ID modello.",
      parameters: {
        type: 'object',
        properties: {
          idModello: { type: 'string', description: "L'ID del modello" },
        },
        required: ['idModello'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'leggi_venditori',
      description: 'Legge la lista dei venditori con le loro percentuali di fee.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registra_vendita',
      description: "Registra la vendita di un prodotto.",
      parameters: {
        type: 'object',
        properties: {
          sku: { type: 'string' },
          prezzoVendita: { type: 'number' },
          dataVendita: { type: 'string', description: 'Formato DD/MM/YYYY' },
          venditore: { type: 'string' },
        },
        required: ['sku', 'prezzoVendita', 'dataVendita'],
      },
    },
  },
]

async function runTool(name: string, args: Record<string, unknown>, baseUrl: string): Promise<unknown> {
  switch (name) {
    case 'leggi_stock': {
      const { data } = await supabase
        .from('stock')
        .select('sku, prezzo_acquisto, scadenza_reso, id_modello, taglia')
        .eq('esito', 'In stock')
      return (data || []).map((r) => ({
        sku: r.sku,
        prezzoAcquisto: r.prezzo_acquisto,
        scadenzaReso: r.scadenza_reso,
        idModello: r.id_modello,
        taglia: r.taglia,
      }))
    }
    case 'cerca_sku': {
      const { data } = await supabase
        .from('stock')
        .select('*')
        .eq('sku', String(args.sku ?? ''))
        .maybeSingle()
      return data
        ? {
            sku: data.sku,
            dataOrdine: data.data_ordine,
            prezzoAcquisto: data.prezzo_acquisto,
            scadenzaReso: data.scadenza_reso,
            esito: data.esito,
            idModello: data.id_modello,
            taglia: data.taglia,
          }
        : { error: 'SKU non trovato' }
    }
    case 'leggi_taglie_modello': {
      const { data } = await supabase
        .from('stock')
        .select('sku, taglia, esito')
        .ilike('id_modello', String(args.idModello ?? ''))
      return data && data.length > 0
        ? data.map((r) => ({ sku: r.sku, taglia: r.taglia, esito: r.esito }))
        : { messaggio: 'Nessun prodotto trovato per questo modello' }
    }
    case 'leggi_venditori': {
      const { data } = await supabase.from('config_venditori').select('*')
      return (data || []).map((r) => ({ nome: r.nome, fee: `${r.fee_percentuale}%` }))
    }
    case 'registra_vendita': {
      const res = await fetch(`${baseUrl}/api/vendite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: args.sku,
          prezzoVendita: args.prezzoVendita,
          dataVendita: args.dataVendita,
          venditore: args.venditore || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore nella registrazione')
      return { success: true, messaggio: `Vendita SKU ${args.sku} registrata a €${args.prezzoVendita}` }
    }
    default:
      return { error: 'Tool non riconosciuto' }
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY non configurata' }, { status: 500 })
    }

    const { messages } = await request.json()

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    const today = new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const systemPrompt = `Sei Vito, l'assistente AI di Rubinos Sellers, un team di reselling di sneakers e abbigliamento.

Rispondi SEMPRE in italiano. Sii conciso, diretto e amichevole.
La data di oggi è: ${today}

Cosa puoi fare:
- Leggere e rispondere su prodotti in stock
- Cercare un prodotto per SKU
- Mostrare le taglie disponibili per un modello
- Leggere la lista dei venditori
- Registrare vendite

Regole importanti:
- Non modificare mai il codice dell'applicazione
- Se l'utente vuole registrare una vendita e ha fornito SKU, prezzo e data, procedi subito senza chiedere conferma
- Se manca qualcosa di essenziale (SKU o prezzo), chiedi prima di procedere
- Quando l'utente dice "oggi" per la data, usa: ${today}
- Dopo aver registrato una vendita, conferma brevemente l'operazione`

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    while (true) {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: chatMessages,
        tools,
        tool_choice: 'auto',
      })

      const choice = response.choices[0]
      chatMessages.push(choice.message)

      if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls?.length) {
        const reply = choice.message.content || 'Non ho capito, puoi ripetere?'
        return NextResponse.json({ reply })
      }

      await Promise.all(
        choice.message.tool_calls.map(async (toolCall) => {
          let result: unknown
          try {
            const tc = toolCall as { id: string; function: { name: string; arguments: string } }
            const args = JSON.parse(tc.function.arguments) as Record<string, unknown>
            result = await runTool(tc.function.name, args, baseUrl)
          } catch (e) {
            result = { error: e instanceof Error ? e.message : 'Errore sconosciuto' }
          }
          chatMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          })
        })
      )
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Vito error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
