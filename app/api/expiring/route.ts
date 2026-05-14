import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Legge il foglio "Stock" — adatta il range in base ai tuoi dati reali
    // Colonne attese: SKU | Nome | Categoria | ModelloID | DataScadenza | ...
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'STOCK!A2:F1000', // Modifica "Stock" col nome del tuo foglio se diverso
    });

    const rows = response.data.values || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiring = rows
      .filter((row) => {
        if (!row[4]) return false; // nessuna data scadenza
        const scadenza = new Date(row[4]);
        if (isNaN(scadenza.getTime())) return false;
        const giorni = Math.ceil(
          (scadenza.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return giorni > 0; // esclude già scaduti
      })
      .map((row) => {
        const scadenza = new Date(row[4]);
        const giorni = Math.ceil(
          (scadenza.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          sku: row[0] || '',
          nome: row[1] || '',
          categoria: row[2] || '',
          modelloId: row[3] || '',
          dataScadenza: row[4] || '',
          giorniRimanenti: giorni,
        };
      })
      // Ordina: chi scade prima va in fondo, chi scade dopo viene prima
      // (da più giorni a meno giorni)
      .sort((a, b) => b.giorniRimanenti - a.giorniRimanenti);

    return NextResponse.json(expiring);
  } catch (error) {
    console.error('Errore API expiring:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dati' },
      { status: 500 }
    );
  }
}