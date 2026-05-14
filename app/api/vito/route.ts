import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readSheet } from '@/lib/sheets'

const tools: Anthropic.Tool[] = [
  {
    name: 'leggi_stock',
    description: 'Legge tutti i prodotti attualmente "In stock". Usa questo per rispondere a domande sullo stock disponibile.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'cerca_sku',
    description: 'Cerca un prodotto specifico tramite il suo codice SKU e restituisce tutti i dettagli.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sku: { type: 'string', description: 'Il codice SKU da cercare (es. 130, SKU-045, ecc.)' },
      },
      required: ['sku'],
    },
  },
  {
    name: 'leggi_taglie_modello',
    description: "Vede tutte le taglie e gli SKU disponibili per un dato ID modello. Utile per rispondere a 'che taglie ho del modello X'.",
    input_schema: {
      type: 'object' as const,
      properties: {
        idModello: { type: 'string', description: "L'ID del modello (es. DOUBLEJ, NIKE-AIR-1, ecc.)" },
      },
      required: ['idModello'],
    },
  },
  {
    name: 'leggi_venditori',
    description: 'Legge la lista dei venditori con le loro percentuali di fee.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'registra_vendita',
    description:
      "Registra la vendita di un prodotto: segna il prodotto come 'Venduto' e aggiunge la vendita al registro. Usalo quando l'utente vuole segnare che ha venduto qualcosa.",
    input_schema: {
      type: 'object' as const,
      properties: {
        sku: { type: 'string', description: 'Il codice SKU del prodotto venduto' },
        prezzoVendita: { type: 'number', description: 'Il prezzo di vendita in euro (solo il numero, es. 30)' },
        dataVendita: {
          type: 'string',
          description:
            "Data della vendita nel formato DD/MM/YYYY. Se l'utente dice 'oggi', usa la data di oggi iniettata nel system prompt.",
        },
        venditore: {
          type: 'string',
          description: 'Nome del venditore (opzionale, stringa vuota se non specificato)',
        },
      },
      required: ['sku', 'prezzoVendita', 'dataVendita'],
    },
  },
]

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurata' }, { status: 500 })
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

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const anthropicMessages: Anthropic.MessageParam[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })
    )

    let response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
    })

    // Agentic loop: esegui tool finché necessario
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b) => b.type === 'tool_use'
      ) as Anthropic.ToolUseBlock[]

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        let result: unknown
        try {
          switch (toolUse.name) {
            case 'leggi_stock': {
              const rows = await readSheet('STOCK!A2:J5000')
              result = rows
                .filter(
                  (r) =>
                    String(r[7] ?? '').trim() === 'In stock' && String(r[0] ?? '').trim()
                )
                .map((r) => ({
                  sku: String(r[0] ?? ''),
                  prezzoAcquisto: String(r[3] ?? ''),
                  scadenzaReso: String(r[4] ?? ''),
                  giorniRimanenti: String(r[5] ?? ''),
                  idModello: String(r[8] ?? ''),
                  taglia: String(r[9] ?? ''),
                }))
              break
            }
            case 'cerca_sku': {
              const input = toolUse.input as { sku: string }
              const rows = await readSheet('STOCK!A2:J5000')
              const found = rows.find(
                (r) =>
                  String(r[0] ?? '').trim().toLowerCase() === input.sku.trim().toLowerCase()
              )
              result = found
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
              break
            }
            case 'leggi_taglie_modello': {
              const input = toolUse.input as { idModello: string }
              const rows = await readSheet('STOCK!A2:J5000')
              result = rows
                .filter(
                  (r) =>
                    String(r[8] ?? '').trim().toUpperCase() ===
                      input.idModello.trim().toUpperCase() && String(r[0] ?? '').trim()
                )
                .map((r) => ({
                  sku: String(r[0] ?? ''),
                  taglia: String(r[9] ?? ''),
                  esito: String(r[7] ?? ''),
                }))
              if ((result as unknown[]).length === 0)
                result = { messaggio: 'Nessun prodotto trovato per questo modello' }
              break
            }
            case 'leggi_venditori': {
              const rows = await readSheet('CONFIG!A2:B')
              result = rows
                .filter((r) => String(r[0] ?? '').trim())
                .map((r) => ({ nome: String(r[0] ?? ''), fee: String(r[1] ?? '') + '%' }))
              break
            }
            case 'registra_vendita': {
              const input = toolUse.input as {
                sku: string
                prezzoVendita: number
                dataVendita: string
                venditore?: string
              }
              const res = await fetch(`${baseUrl}/api/vendite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sku: input.sku,
                  prezzoVendita: input.prezzoVendita,
                  dataVendita: input.dataVendita,
                  venditore: input.venditore || '',
                }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || 'Errore nella registrazione')
              result = {
                success: true,
                messaggio: `Vendita SKU ${input.sku} registrata a €${input.prezzoVendita}`,
              }
              break
            }
            default:
              result = { error: 'Tool non riconosciuto' }
          }
        } catch (e) {
          result = { error: e instanceof Error ? e.message : 'Errore sconosciuto' }
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
      }

      anthropicMessages.push({ role: 'assistant', content: response.content })
      anthropicMessages.push({ role: 'user', content: toolResults })

      response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages: anthropicMessages,
      })
    }

    const textBlock = response.content.find((b) => b.type === 'text') as
      | Anthropic.TextBlock
      | undefined
    const reply = textBlock?.text || 'Non ho capito, puoi ripetere?'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Vito error:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
