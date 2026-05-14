import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readSheet } from '@/lib/sheets'

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
          sku: { type: 'string', description: 'Il codice SKU da cercare (es. 130, SKU-045, ecc.)' },
        },
        required: ['sku'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'leggi_taglie_modello',
      description: "Vede tutte le taglie e gli SKU disponibili per un dato ID modello. Usalo per 'che taglie ho del modello X'.",
      parameters: {
        type: 'object',
        properties: {
          idModello: { type: 'string', description: "L'ID del modello (es. DOUBLEJ, NIKE-AIR-1, ecc.)" },
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
      description: "Registra la vendita di un prodotto: segna il prodotto come 'Venduto' e aggiunge la vendita al registro.",
      parameters: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Il codice SKU del prodotto venduto' },
          prezzoVendita: { type: 'number', description: 'Il prezzo di vendita in euro (solo il numero, es. 30)' },
          dataVendita: {
            type: 'string',
            description: "Data della vendita nel formato DD/MM/YYYY. Se l'utente dice 'oggi', usa la data di oggi iniettata nel system prompt.",
          },
          venditore: {
            type: 'string',
            description: 'Nome del venditore (stringa vuota se non specificato)',
          },
        },
        required: ['sku', 'prezzoVendita', 'dataVendita'],
      },
    },
  },
]

async function runTool(name: string, args: Record<string, unknown>, baseUrl: string): Promise<unknown> {
  switch (name) {
    case 'leggi_stock': {
      const rows = await readSheet('STOCK!A2:J5000')
      return rows
        .filter((r) => String(r[7] ?? '').trim() === 'In stock' && String(r[0] ?? '').trim())
        .map((r) => ({
          sku: String(r[0] ?? ''),
          prezzoAcquisto: String(r[3] ?? ''),
          scadenzaReso: String(r[4] ?? ''),
          giorniRimanenti: String(r[5] ?? ''),
          idModello: String(r[8] ?? ''),
          taglia: String(r[9] ?? ''),
        }))
    }
    case 'cerca_sku': {
      const rows = await readSheet('STOCK!A2:J5000')
      const found = rows.find(
        (r) => String(r[0] ?? '').trim().toLowerCase() === String(args.sku ?? '').trim().toLowerCase()
      )
      return found
        ? {
            sku: String(found[0] ?? ''),
            dataOrdine: String(found[2] ?? ''),
            prezzoAcquisto: String(found[3] ?? ''),
            scadenzaReso: String(found[4] ?? ''),
            giorniRimanenti: String(found[5] ?? ''),
            esito: String(found[7] ?? ''),
            idModello: String(found[8] ?? ''),
            taglia: String(found[9] ?? ''),
          }
        : { error: 'SKU non trovato' }
    }
    case 'leggi_taglie_modello': {
      const rows = await readSheet('STOCK!A2:J5000')
      const result = rows
        .filter(
          (r) =>
            String(r[8] ?? '').trim().toUpperCase() === String(args.idModello ?? '').trim().toUpperCase() &&
            String(r[0] ?? '').trim()
        )
        .map((r) => ({
          sku: String(r[0] ?? ''),
          taglia: String(r[9] ?? ''),
          esito: String(r[7] ?? ''),
        }))
      return result.length > 0 ? result : { messaggio: 'Nessun prodotto trovato per questo modello' }
    }
    case 'leggi_venditori': {
      const rows = await readSheet('CONFIG!A2:B')
      return rows
        .filter((r) => String(r[0] ?? '').trim())
        .map((r) => ({ nome: String(r[0] ?? ''), fee: String(r[1] ?? '') + '%' }))
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

    // Agentic loop
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

      // Esegui tutti i tool call in parallelo
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
    console.error('Vito error:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
