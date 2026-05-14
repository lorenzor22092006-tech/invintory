export interface CapoStock {
    sku: string
    numeroOrdine: string
    dataOrdine: string
    prezzoAcquisto: number
    scadenzaReso: string
    giorniRimanenti: number
    statoScadenza: string
    esito: string
    idModello: string
    taglia: string
  }
  
  export interface Vendita {
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
  }
  
  export interface ModelloTaglie {
    idModello: string
    categoria: string
    fotoUrl: string
    stockXS: number
    stockS: number
    stockM: number
    stockL: number
    arrivoXS: number
    arrivoS: number
    arrivoM: number
    arrivoL: number
    skuXS: string
    skuS: string
    skuM: string
    skuL: string
  }
  
  export interface Venditore {
    nome: string
    feePercentuale: number
  }
  
  export interface KpiDashboard {
    totaleStock: number
    totaleVenduti: number
    totaleResi: number
    scadenzeImminenti: number
    scaduti: number
    fatturato: number
    costoAcquisti: number
    guadagnoLordo: number
    feeTotali: number
    guadagnoNetto: number
    rimanenze: number
  }