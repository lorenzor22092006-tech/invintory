import type { KpiDashboard, Vendita } from '@/lib/types'

const SNEAKER_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1606107557195-0a74c9c9ac0a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560769629-849de74a3f7d?w=400&h=400&fit=crop',
]

export const demoStockItems = [
  { sku: '1042', numeroOrdine: 'PO-098-2211', dataOrdine: '12/06/2026', prezzoAcquisto: '€ 89,00', scadenzaReso: '12/07/2026', giorniRimanenti: 11, statoScadenza: '', esito: 'In stock', idModello: 'AJ1 CHICAGO', taglia: '42' },
  { sku: '1043', numeroOrdine: 'PO-098-2211', dataOrdine: '12/06/2026', prezzoAcquisto: '€ 92,50', scadenzaReso: '12/07/2026', giorniRimanenti: 11, statoScadenza: '', esito: 'In stock', idModello: 'AJ1 CHICAGO', taglia: '43' },
  { sku: '1088', numeroOrdine: 'PO-112-8844', dataOrdine: '18/06/2026', prezzoAcquisto: '€ 134,00', scadenzaReso: '18/07/2026', giorniRimanenti: 17, statoScadenza: '', esito: 'In stock', idModello: 'DUNK LOW PANDA', taglia: '41' },
  { sku: '1091', numeroOrdine: 'PO-112-8844', dataOrdine: '18/06/2026', prezzoAcquisto: '€ 128,00', scadenzaReso: '18/07/2026', giorniRimanenti: 17, statoScadenza: '', esito: 'In stock', idModello: 'DUNK LOW PANDA', taglia: '44' },
  { sku: '1105', numeroOrdine: 'PO-120-3310', dataOrdine: '22/06/2026', prezzoAcquisto: '€ 76,00', scadenzaReso: '05/07/2026', giorniRimanenti: 4, statoScadenza: '🟡 IN SCADENZA', esito: 'In stock', idModello: 'NB 550 GREY', taglia: '40' },
  { sku: '1106', numeroOrdine: 'PO-120-3310', dataOrdine: '22/06/2026', prezzoAcquisto: '€ 74,50', scadenzaReso: '03/07/2026', giorniRimanenti: 2, statoScadenza: '🟡 IN SCADENZA', esito: 'In stock', idModello: 'NB 550 GREY', taglia: '42' },
  { sku: '1120', numeroOrdine: 'PO-125-9901', dataOrdine: '25/06/2026', prezzoAcquisto: '€ 198,00', scadenzaReso: '01/07/2026', giorniRimanenti: 0, statoScadenza: '🟡 IN SCADENZA', esito: 'In stock', idModello: 'YEEZY SLIDE ONS', taglia: '43' },
  { sku: '1133', numeroOrdine: 'PO-130-5522', dataOrdine: '28/06/2026', prezzoAcquisto: '€ 156,00', scadenzaReso: '28/07/2026', giorniRimanenti: 27, statoScadenza: '', esito: 'In stock', idModello: 'JORDAN 4 BRED', taglia: '42.5' },
  { sku: '1144', numeroOrdine: 'PO-130-5522', dataOrdine: '28/06/2026', prezzoAcquisto: '€ 162,00', scadenzaReso: '28/07/2026', giorniRimanenti: 27, statoScadenza: '', esito: 'In stock', idModello: 'JORDAN 4 BRED', taglia: '44' },
  { sku: '1155', numeroOrdine: 'PO-140-7788', dataOrdine: '01/06/2026', prezzoAcquisto: '€ 68,00', scadenzaReso: '20/06/2026', giorniRimanenti: -11, statoScadenza: '🔴 SCADUTO', esito: 'In stock', idModello: 'ADIDAS SAMBA OG', taglia: '41' },
  { sku: '1166', numeroOrdine: 'PO-140-7788', dataOrdine: '01/06/2026', prezzoAcquisto: '€ 71,00', scadenzaReso: '18/06/2026', giorniRimanenti: -13, statoScadenza: '🔴 SCADUTO', esito: 'In stock', idModello: 'ADIDAS SAMBA OG', taglia: '42' },
  { sku: '1188', numeroOrdine: 'PO-150-4411', dataOrdine: '15/05/2026', prezzoAcquisto: '€ 210,00', scadenzaReso: '15/06/2026', giorniRimanenti: -16, statoScadenza: '🔴 SCADUTO', esito: 'In stock', idModello: 'TRAVIS SCOTT MOCHA', taglia: '43' },
  { sku: '1201', numeroOrdine: 'PO-160-2200', dataOrdine: '10/04/2026', prezzoAcquisto: '€ 95,00', scadenzaReso: '10/05/2026', giorniRimanenti: -52, statoScadenza: '', esito: 'Venduto', idModello: 'AIR MAX 90', taglia: '42' },
  { sku: '1202', numeroOrdine: 'PO-161-2201', dataOrdine: '12/04/2026', prezzoAcquisto: '€ 88,00', scadenzaReso: '12/05/2026', giorniRimanenti: -50, statoScadenza: '', esito: 'Reso', idModello: 'AIR MAX 90', taglia: '41' },
  { sku: '1210', numeroOrdine: 'PO-170-3300', dataOrdine: '20/06/2026', prezzoAcquisto: '€ 142,00', scadenzaReso: '20/07/2026', giorniRimanenti: 19, statoScadenza: '', esito: 'In stock', idModello: 'NEW BALANCE 2002R', taglia: '43' },
]

export type DemoStockItem = (typeof demoStockItems)[number]

export const demoTaglieItems = [
  { idModello: 'AJ1 CHICAGO', categoria: 'Jordan', fotoUrl: SNEAKER_IMAGES[0], xsStock: 0, sStock: 1, mStock: 2, lStock: 1, skuXS: '', skuS: '1041', skuM: '1042', skuL: '1043' },
  { idModello: 'DUNK LOW PANDA', categoria: 'Nike', fotoUrl: SNEAKER_IMAGES[1], xsStock: 0, sStock: 0, mStock: 3, lStock: 2, skuXS: '', skuS: '', skuM: '1088', skuL: '1091' },
  { idModello: 'NB 550 GREY', categoria: 'New Balance', fotoUrl: SNEAKER_IMAGES[2], xsStock: 0, sStock: 1, mStock: 2, lStock: 0, skuXS: '', skuS: '1104', skuM: '1105', skuL: '1106' },
  { idModello: 'YEEZY SLIDE ONS', categoria: 'Yeezy', fotoUrl: SNEAKER_IMAGES[3], xsStock: 0, sStock: 0, mStock: 1, lStock: 0, skuXS: '', skuS: '', skuM: '1120', skuL: '' },
  { idModello: 'JORDAN 4 BRED', categoria: 'Jordan', fotoUrl: SNEAKER_IMAGES[4], xsStock: 0, sStock: 0, mStock: 1, lStock: 2, skuXS: '', skuS: '', skuM: '1133', skuL: '1144' },
  { idModello: 'ADIDAS SAMBA OG', categoria: 'Adidas', fotoUrl: SNEAKER_IMAGES[5], xsStock: 0, sStock: 0, mStock: 2, lStock: 0, skuXS: '', skuS: '', skuM: '1155', skuL: '1166' },
  { idModello: 'TRAVIS SCOTT MOCHA', categoria: 'Jordan', fotoUrl: SNEAKER_IMAGES[6], xsStock: 0, sStock: 0, mStock: 1, lStock: 0, skuXS: '', skuS: '', skuM: '1188', skuL: '' },
  { idModello: 'NEW BALANCE 2002R', categoria: 'New Balance', fotoUrl: SNEAKER_IMAGES[7], xsStock: 0, sStock: 0, mStock: 1, lStock: 0, skuXS: '', skuS: '', skuM: '1210', skuL: '' },
  { idModello: 'AIR MAX 90', categoria: 'Nike', fotoUrl: SNEAKER_IMAGES[0], xsStock: 0, sStock: 0, mStock: 0, lStock: 0, skuXS: '', skuS: '', skuM: '1201', skuL: '' },
]

export const demoCategorie = ['Jordan', 'Nike', 'Adidas', 'New Balance', 'Yeezy']

export const demoVenditori = [
  { nome: 'Lorenzo', feePercentuale: 15 },
  { nome: 'Marco', feePercentuale: 12 },
  { nome: 'Giulia', feePercentuale: 10 },
  { nome: 'Andrea', feePercentuale: 18 },
]

export const demoVendite: Vendita[] = [
  { sku: '901', idModello: 'AJ1 CHICAGO', taglia: '42', dataVendita: '28/06/2026', prezzoAcquisto: 89, prezzoVendita: 245, guadagnoLordo: 156, venditore: 'Lorenzo', fee: 23.4, guadagnoNetto: 132.6 },
  { sku: '902', idModello: 'DUNK LOW PANDA', taglia: '41', dataVendita: '27/06/2026', prezzoAcquisto: 134, prezzoVendita: 189, guadagnoLordo: 55, venditore: 'Marco', fee: 6.6, guadagnoNetto: 48.4 },
  { sku: '903', idModello: 'NB 550 GREY', taglia: '40', dataVendita: '26/06/2026', prezzoAcquisto: 76, prezzoVendita: 118, guadagnoLordo: 42, venditore: 'Giulia', fee: 4.2, guadagnoNetto: 37.8 },
  { sku: '904', idModello: 'JORDAN 4 BRED', taglia: '44', dataVendita: '25/06/2026', prezzoAcquisto: 162, prezzoVendita: 310, guadagnoLordo: 148, venditore: 'Lorenzo', fee: 22.2, guadagnoNetto: 125.8 },
  { sku: '905', idModello: 'ADIDAS SAMBA OG', taglia: '41', dataVendita: '24/06/2026', prezzoAcquisto: 68, prezzoVendita: 95, guadagnoLordo: 27, venditore: 'Andrea', fee: 4.86, guadagnoNetto: 22.14 },
  { sku: '906', idModello: 'YEEZY SLIDE ONS', taglia: '43', dataVendita: '22/06/2026', prezzoAcquisto: 198, prezzoVendita: 265, guadagnoLordo: 67, venditore: 'Marco', fee: 8.04, guadagnoNetto: 58.96 },
  { sku: '907', idModello: 'NEW BALANCE 2002R', taglia: '43', dataVendita: '20/06/2026', prezzoAcquisto: 142, prezzoVendita: 198, guadagnoLordo: 56, venditore: 'Giulia', fee: 5.6, guadagnoNetto: 50.4 },
  { sku: '908', idModello: 'AJ1 CHICAGO', taglia: '43', dataVendita: '18/06/2026', prezzoAcquisto: 92.5, prezzoVendita: 238, guadagnoLordo: 145.5, venditore: 'Lorenzo', fee: 21.83, guadagnoNetto: 123.67 },
  { sku: '909', idModello: 'DUNK LOW PANDA', taglia: '44', dataVendita: '15/06/2026', prezzoAcquisto: 128, prezzoVendita: 175, guadagnoLordo: 47, venditore: 'Andrea', fee: 8.46, guadagnoNetto: 38.54 },
  { sku: '910', idModello: 'TRAVIS SCOTT MOCHA', taglia: '43', dataVendita: '12/06/2026', prezzoAcquisto: 210, prezzoVendita: 420, guadagnoLordo: 210, venditore: 'Lorenzo', fee: 31.5, guadagnoNetto: 178.5 },
  { sku: '911', idModello: 'NB 550 GREY', taglia: '42', dataVendita: '10/06/2026', prezzoAcquisto: 74.5, prezzoVendita: 112, guadagnoLordo: 37.5, venditore: 'Marco', fee: 4.5, guadagnoNetto: 33 },
  { sku: '912', idModello: 'AIR MAX 90', taglia: '42', dataVendita: '08/06/2026', prezzoAcquisto: 95, prezzoVendita: 145, guadagnoLordo: 50, venditore: 'Giulia', fee: 5, guadagnoNetto: 45 },
  { sku: '913', idModello: 'JORDAN 4 BRED', taglia: '42.5', dataVendita: '05/06/2026', prezzoAcquisto: 156, prezzoVendita: 295, guadagnoLordo: 139, venditore: 'Lorenzo', fee: 20.85, guadagnoNetto: 118.15 },
  { sku: '914', idModello: 'ADIDAS SAMBA OG', taglia: '42', dataVendita: '02/06/2026', prezzoAcquisto: 71, prezzoVendita: 99, guadagnoLordo: 28, venditore: 'Andrea', fee: 5.04, guadagnoNetto: 22.96 },
  { sku: '915', idModello: 'DUNK LOW PANDA', taglia: '41', dataVendita: '28/05/2026', prezzoAcquisto: 130, prezzoVendita: 182, guadagnoLordo: 52, venditore: 'Marco', fee: 6.24, guadagnoNetto: 45.76 },
]

export function getDemoKpi(): KpiDashboard {
  const inStock = demoStockItems.filter((i) => i.esito === 'In stock')
  const venduti = demoStockItems.filter((i) => i.esito === 'Venduto').length
  const resi = demoStockItems.filter((i) => i.esito === 'Reso').length
  const scadenzeImminenti = inStock.filter((i) => i.giorniRimanenti >= 0 && i.giorniRimanenti <= 15).length
  const scaduti = inStock.filter((i) => i.giorniRimanenti < 0).length
  const fatturato = demoVendite.reduce((s, v) => s + v.prezzoVendita, 0)
  const costoAcquisti = demoVendite.reduce((s, v) => s + v.prezzoAcquisto, 0)
  const guadagnoLordo = demoVendite.reduce((s, v) => s + v.guadagnoLordo, 0)
  const feeTotali = demoVendite.reduce((s, v) => s + v.fee, 0)
  const guadagnoNetto = demoVendite.reduce((s, v) => s + v.guadagnoNetto, 0)
  const rimanenze = inStock.reduce((s, i) => {
    const n = parseFloat(i.prezzoAcquisto.replace(/[^\d,]/g, '').replace(',', '.')) || 0
    return s + n
  }, 0)

  return {
    totaleStock: inStock.length,
    totaleVenduti: venduti,
    totaleResi: resi,
    scadenzeImminenti,
    scaduti,
    fatturato: Math.round(fatturato * 100) / 100,
    costoAcquisti: Math.round(costoAcquisti * 100) / 100,
    guadagnoLordo: Math.round(guadagnoLordo * 100) / 100,
    feeTotali: Math.round(feeTotali * 100) / 100,
    guadagnoNetto: Math.round(guadagnoNetto * 100) / 100,
    rimanenze: Math.round(rimanenze * 100) / 100,
  }
}

export const demoConfig = {
  venditori: demoVenditori,
  categorie: demoCategorie,
}

export const demoStockResponse = {
  items: demoStockItems,
}
