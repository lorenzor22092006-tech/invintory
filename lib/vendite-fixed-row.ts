/**
 * Layout fisso foglio VENDITE (Rubinos Sellers):
 * A SKU, B ID Modello, C Taglia, D Data Vendita, E Prezzo Acquisto €, F Prezzo Vendita €,
 * G Guadagno Lordo €, H Venditore, I Fee €, J Guadagno Netto €, K Note
 *
 * Valori numerici in E–G, I, J così le formule del foglio (es. colonna J) continuano a funzionare.
 */

export type VenditeFixedPayload = {
  sku: string
  idModello: string
  taglia: string
  dataVendita: string
  prezzoAcquisto: number
  prezzoVendita: number
  guadagnoLordo: number
  venditore: string
  fee: number
  guadagnoNetto: number
  nota?: string
}

/** Una riga completa A:K per writeSheet. */
export function buildVenditeFixedRow(p: VenditeFixedPayload): (string | number)[] {
  return [
    p.sku,
    p.idModello,
    p.taglia,
    p.dataVendita,
    p.prezzoAcquisto,
    p.prezzoVendita,
    p.guadagnoLordo,
    p.venditore,
    p.fee,
    p.guadagnoNetto,
    p.nota ?? '',
  ]
}

/** Legge una riga dati (array) con indici fissi 0..9 (+10 note). */
export function parseVenditeFixedRow(row: string[]): {
  sku: string
  idModello: string
  taglia: string
  dataVendita: string
  prezzoAcquisto: string
  prezzoVendita: string
  guadagnoLordo: string
  venditore: string
  fee: string
  guadagnoNetto: string
} {
  const g = (i: number) => String(row[i] ?? '')
  return {
    sku: g(0),
    idModello: g(1),
    taglia: g(2),
    dataVendita: g(3),
    prezzoAcquisto: g(4),
    prezzoVendita: g(5),
    guadagnoLordo: g(6),
    venditore: g(7),
    fee: g(8),
    guadagnoNetto: g(9),
  }
}
