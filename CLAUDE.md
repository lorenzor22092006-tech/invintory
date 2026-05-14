@AGENTS.md
# INVINTORY — Istruzioni complete di progetto

> Documento di contesto per assistenti AI. Leggi tutto prima di rispondere o suggerire codice.

---

## 1. CHI SONO E COME LAVORO

- Sono un utente **non esperto di coding** — so usare Cursor, copiare e incollare codice, lanciare comandi nel terminale, ma non so scrivere codice da zero.
- Uso un **Mac**.
- L'IDE che uso è **Cursor** (basato su VS Code).
- Il terminale lo apro da Cursor: Terminal → New Terminal.
- Quando mi dai istruzioni, devo poter **copiare i comandi esatti** da incollare nel terminale o nel file, senza dover capire cosa c'è dentro.
- Spiega sempre **passo per passo** dove cliccare, dove creare il file, e cosa incollare.

---

## 2. IL PROGETTO: INVINTORY

**INVINTORY** è una web app mobile-first per la gestione dello stock di un'attività di **reselling di sneakers**.

L'app serve a:
- Tenere traccia di tutti i prodotti in stock (acquistati ma non ancora venduti)
- Monitorare le **scadenze di reso** (ogni prodotto ha una data entro cui può essere restituito al fornitore)
- Registrare vendite e resi
- Visualizzare statistiche di bilancio (profitti, spese, margini)
- Gestire le taglie disponibili
- Coordinare il lavoro del team

Il nome del brand/team è **Rubinos Sellers**.

---

## 3. STACK TECNOLOGICO

| Componente | Tecnologia |
|---|---|
| Framework | **Next.js 14** con App Router |
| Linguaggio | **TypeScript** |
| Stili | **Tailwind CSS** (ma la maggior parte degli stili sono inline con oggetti JS per compatibilità) |
| Database | **Google Sheets** (foglio Google come database) |
| API Sheets | **Google Sheets API v4** via `googleapis` npm package |
| Auth Sheets | **Google Service Account** |
| Deploy | **Vercel** con deploy automatico da GitHub |
| Repo | **GitHub** collegato a Vercel |

---

## 4. INFRASTRUTTURA GOOGLE CLOUD

- **Progetto Google Cloud**: `invintory-496113`
- **Service Account**: `invintory-sheets@invintory-496113.iam.gserviceaccount.com`
- **API abilitata**: Google Sheets API v4
- Il foglio Google è condiviso con il service account in lettura/scrittura

### File `.env.local` (nella root del progetto, NON committato su GitHub)

```
GOOGLE_SHEET_ID=<id del foglio Google>
GOOGLE_SERVICE_ACCOUNT_EMAIL=invintory-sheets@invintory-496113.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

> ⚠️ La `GOOGLE_PRIVATE_KEY` va sempre con i `\n` letterali (non vere newline) nel `.env.local`. Nel codice si usa `.replace(/\\n/g, '\n')` per convertirli.

---

## 5. STRUTTURA CARTELLE DEL PROGETTO

```
invintory/
├── app/
│   ├── api/
│   │   └── stock/
│   │       └── route.ts          ← API che legge da Google Sheets
│   ├── bilancio/
│   │   └── page.tsx              ← Pagina bilancio (da completare)
│   ├── taglie/
│   │   └── page.tsx              ← Pagina taglie / size (da completare)
│   ├── vendite/
│   │   └── page.tsx              ← Pagina vendite (da completare)
│   ├── stock/
│   │   └── nuovo/
│   │       └── page.tsx          ← Form registra nuovo prodotto (da completare)
│   ├── team/
│   │   └── page.tsx              ← Pagina team (da creare)
│   ├── globals.css               ← Stili globali, sfondo scuro, reset browser
│   ├── layout.tsx                ← Layout root con BottomNav e padding bottom
│   └── page.tsx                  ← Home page (aggiornata - vedi stato attuale)
├── components/
│   ├── BottomNav.tsx             ← Bottom navigation mobile (5 voci)
│   └── Nav.tsx                   ← Navbar desktop (non più usata)
├── lib/
│   ├── sheets.ts                 ← Connessione Google Sheets (helper functions)
│   └── types.ts                  ← Tipi TypeScript condivisi
├── public/
│   └── logo.png                  ← Logo INVINTORY
├── .env.local                    ← Variabili d'ambiente (NON su GitHub)
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 6. DESIGN SYSTEM

L'app è **ottimizzata per mobile** con `max-width: 430px` centrato.

### Colori

| Ruolo | Valore |
|---|---|
| Background principale | `#061311` |
| Background card / secondario | `#0B1F1A` |
| Background terziario | `#102A24` |
| Bordi | `#1B3A34` |
| Accento verde principale | `#10B981` |
| Accento verde chiaro | `#22C55E` |
| Accento verde scuro | `#059669` |
| Testo principale | `#F8FAFC` |
| Testo secondario | `#94A3B8` |
| Testo disabilitato / hint | `#64748B` |
| Rosso errore / scaduto | `#EF4444` |
| Giallo warning / in scadenza | `#F59E0B` |

### Font
- Attuale: `system-ui` (font di sistema)
- Pianificato: migrare a **Syne** (titoli) + **DM Sans** (testo)

### Stile componenti
- Bordi arrotondati: `border-radius: 14px` per card, `16px` per bottoni grandi
- Ombre: `box-shadow: 0 4px 24px rgba(16,185,129,0.25)` per bottoni primari
- Niente bordi bianchi del browser: impostato in `globals.css`
- Supporto notch iPhone nella BottomNav

---

## 7. STRUTTURA DATI — GOOGLE SHEETS

Il foglio principale si chiama (probabilmente) **Sheet1** o simile. Le colonne sono:

| Colonna | Nome campo | Descrizione |
|---|---|---|
| A | SKU | Numero identificativo univoco del prodotto |
| B | Numero Ordine | Codice ordine fornitore (es. PO-098-...) |
| C | Data Ordine | Data acquisto (formato GG/MM/AAAA) |
| D | Prezzo Acquisto € | Prezzo pagato (es. "€ 19,34") |
| E | Scadenza Reso | Data limite per il reso (formato GG/MM/AAAA) |
| F | Giorni Rimanenti | Numero giorni alla scadenza (numero intero, negativo se scaduto) |
| G | Stato Scadenza | Etichetta: "🟡 IN SCADENZA", "🔴 SCADUTO", o vuoto |
| H | Esito | Stato del prodotto: "In stock", "Venduto", "Reso" |
| I | ID Modello | Identificativo del modello/scarpa |
| J | Taglia | Taglia del prodotto |

### Logica importante
- Un prodotto è **attivo in stock** se `Esito === "In stock"`
- Un prodotto è **in scadenza** se `Esito === "In stock"` e `Giorni Rimanenti >= 0`
- Un prodotto è **scaduto** se `Giorni Rimanenti < 0` (non mostrare nella lista scadenze home)
- Venduto e Reso = archiviati, non contano per lo stock attivo

---

## 8. STATO ATTUALE DELL'APP (maggio 2026)

### ✅ Completato

**`app/page.tsx` — Home Page**
- Logo INVINTORY centrato + sottotitolo "Gestisci il tuo stock"
- Barra di ricerca per SKU (reindirizza a `/stock?search=...`)
- Due bottoni grandi: **"Registra Vendita"** (verde, va su `/vendite/nuova`) e **"Registra Prodotto"** (scuro, va su `/stock/nuovo`)
- Sezione **"Prodotti in scadenza"**: lista scrollabile dei prodotti `In stock` con `Giorni Rimanenti >= 0`, ordinati dal più lontano al più vicino alla scadenza
- Ogni card mostra: SKU badge, ID Modello, Taglia, data scadenza, giorni rimanenti colorati (verde >7gg, giallo ≤7gg, rosso ≤3gg)
- Dati reali da Google Sheets via `/api/stock`
- Stato loading con skeleton animati

**`app/api/stock/route.ts` — API Google Sheets**
- Legge tutte le righe dal foglio (range A:J)
- Restituisce array di oggetti `StockItem`
- Usa service account per autenticazione

**`components/BottomNav.tsx` — Navigazione mobile**
- 5 voci: Home (`/`), Size (`/taglie`), Vendite (`/vendite`), Bilancio (`/bilancio`), Team (`/team`)
- Icona attiva diventa verde con sfondo verde trasparente
- Supporto safe area / notch iPhone
- Fissa in basso

**`app/layout.tsx`**
- Include BottomNav
- `padding-bottom` per non coprire contenuti con la navbar
- Background scuro globale

**`app/globals.css`**
- Sfondo `#061311` su tutto
- Reset bordi bianchi browser
- Font system-ui

### 🔄 Da completare / costruire

| Pagina | Percorso | Stato | Note |
|---|---|---|---|
| Dettaglio prodotto | `/stock/[sku]` | Da creare | Click su un prodotto dello stock |
| Registra prodotto | `/stock/nuovo` | Da completare | Form per aggiungere nuovo SKU al foglio |
| Registra vendita | `/vendite/nuova` | Da creare | Form per segnare un prodotto come venduto |
| Lista vendite | `/vendite` | Da completare | Storico di tutto il venduto |
| Bilancio | `/bilancio` | Da completare | KPI: profitto totale, spese, margine |
| Taglie / Size | `/taglie` | Da completare | Distribuzione taglie disponibili in stock |
| Team | `/team` | Da creare | Membri del team, statistiche per membro |

---

## 9. ISTRUZIONI PER L'AI — COME AIUTARMI

1. **Dai sempre codice completo** da copiare e incollare — non snippet parziali
2. **Specifica sempre il percorso esatto** del file dove incollare (es. `app/page.tsx`, `app/api/stock/route.ts`)
3. **Spiega passo per passo** cosa fare in Cursor: dove cliccare, come creare cartelle, come salvare
4. **Non usare librerie nuove** senza prima verificare che siano già in `package.json` o senza dirmi di installarle con il comando esatto
5. **Tutti gli stili** devono seguire il design system sopra (colori, border-radius, font)
6. **L'app è solo mobile**: max-width 430px, niente layout desktop, niente sidebar
7. **I dati vengono da Google Sheets** via `/api/stock` — non hardcodare dati finti nelle pagine finali
8. **TypeScript**: usare sempre i tipi corretti, niente `any` se possibile
9. Se devo installare un package, dimmi esattamente: `npm install <pacchetto>` da incollare nel terminale di Cursor
10. Se c'è un errore che mi ritrovo nel terminale o nel browser, chiedimi di incollartelo e lo analizzi

---

## 10. COMANDI UTILI DA TERMINALE (Cursor → Terminal → New Terminal)

```bash
# Avvia il server di sviluppo locale
npm run dev
# → apri http://localhost:3000 nel browser

# Installa un nuovo package
npm install <nome-package>

# Build di produzione (test prima del deploy)
npm run build

# Deploy su Vercel (automatico al push su GitHub)
git add .
git commit -m "descrizione modifica"
git push
```

---

## 11. NOTE FINALI

- Il file CSV `Rubinos_Sellers__STOCK.csv` è una **copia locale del foglio Google** usata solo come riferimento per capire la struttura dei dati — l'app legge sempre da Google Sheets in tempo reale.
- Vercel è già configurato con le variabili d'ambiente (le stesse del `.env.local`).
- Il dominio di produzione è su Vercel (chiedimi se non lo ricordi).
- Il logo INVINTORY è un cubo 3D con le lettere IN/TO/RY in verde con gradiente.