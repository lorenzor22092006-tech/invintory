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
    prezzoVendita: number
    dataVendita: string
    venditore: string
    numeroOrdine: string
    dataOrdine: string
    prezzoAcquisto: number
    idModello: string
    taglia: string
  }
  
  export interface ModelloTaglie {
    idModello: string
    categoria: string
    fotoUrl: string
    stockXS: number
    stockS: number
    stockM: number
    stockL: number
    arrivi: number
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
    fatturato: number
    guadagnoNetto: number
  }