'use client'

import { useState, useEffect } from 'react'
import { KpiDashboard } from '@/lib/types'

export default function Bilancio() {
  const [kpi, setKpi] = useState<KpiDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        setKpi(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-sm text-gray-400 mt-8 text-center">Caricamento...</p>
  if (!kpi) return <p className="text-sm text-red-500 mt-8 text-center">Errore caricamento dati</p>

  function euro(n: number) {
    return '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2 })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Bilancio</h1>
        <span className="text-xs text-gray-400">aggiornato in automatico</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Fatturato totale</div>
          <div className="text-2xl font-semibold text-gray-900">{euro(kpi.fatturato)}</div>
          <div className="text-xs text-gray-400 mt-1">{kpi.totaleVenduti} vendite</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Guadagno netto</div>
          <div className="text-2xl font-semibold text-green-600">{euro(kpi.guadagnoNetto)}</div>
          <div className="text-xs text-gray-400 mt-1">dopo fee venditori</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Capi in stock</div>
          <div className="text-2xl font-semibold text-gray-900">{kpi.totaleStock}</div>
          <div className="text-xs text-gray-400 mt-1">valore {euro(kpi.rimanenze)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Scadenze imminenti</div>
          <div className={`text-2xl font-semibold ${kpi.scadenzeImminenti > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
            {kpi.scadenzeImminenti}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {kpi.scaduti > 0 ? `${kpi.scaduti} già scaduti` : 'entro 15 giorni'}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Riepilogo finanziario</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Fatturato totale</span>
            <span className="font-medium">{euro(kpi.fatturato)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Costo acquisti</span>
            <span className="font-medium text-red-500">-{euro(kpi.costoAcquisti)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Guadagno lordo</span>
            <span className="font-medium">{euro(kpi.guadagnoLordo)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Fee venditori</span>
            <span className="font-medium text-red-500">-{euro(kpi.feeTotali)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm font-medium border-t border-gray-200">
            <span className="text-gray-900">Guadagno netto</span>
            <span className="text-green-600">{euro(kpi.guadagnoNetto)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Stock</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Totale capi ordinati</span>
            <span className="font-medium">{kpi.totaleStock + kpi.totaleVenduti + kpi.totaleResi}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">In stock</span>
            <span className="font-medium">{kpi.totaleStock}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Venduti</span>
            <span className="font-medium">{kpi.totaleVenduti}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Resi</span>
            <span className="font-medium">{kpi.totaleResi}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">Valore rimanenze</span>
            <span className="font-medium">{euro(kpi.rimanenze)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}