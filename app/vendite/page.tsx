'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Vendita } from '@/lib/types'

function VenditePage() {
  const [vendite, setVendite] = useState<Vendita[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [venditori, setVenditori] = useState<string[]>([])
  const [form, setForm] = useState({
    sku: '',
    prezzoVendita: '',
    dataVendita: new Date().toISOString().split('T')[0],
    venditore: '',
  })
  const [messaggio, setMessaggio] = useState('')
  const [errore, setErrore] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    caricaVendite()
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        const nomi = data.venditori
          .map((v: any) => v.nome)
          .filter((n: string) => n)
        setVenditori(nomi)
      })
    const skuParam = searchParams.get('sku')
    const nuovoParam = searchParams.get('nuovo')
    if (skuParam) {
      setForm((f) => ({ ...f, sku: skuParam }))
      setShowForm(true)
    }
    if (nuovoParam) setShowForm(true)
  }, [])

  function caricaVendite() {
    fetch('/api/vendite')
      .then((r) => r.json())
      .then((data) => {
        setVendite(data)
        setLoading(false)
      })
  }

  const venditeFilrate = vendite.filter((v) =>
    v.sku.toLowerCase().includes(search.toLowerCase())
  )

  async function registraVendita() {
    setErrore('')
    setMessaggio('')
    if (!form.sku || !form.prezzoVendita || !form.dataVendita) {
      setErrore('Compila SKU, prezzo e data')
      return
    }
    const res = await fetch('/api/vendite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: form.sku,
        prezzoVendita: parseFloat(form.prezzoVendita),
        dataVendita: form.dataVendita,
        venditore: form.venditore,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setMessaggio('Vendita registrata con successo!')
      setShowForm(false)
      setForm({
        sku: '',
        prezzoVendita: '',
        dataVendita: new Date().toISOString().split('T')[0],
        venditore: '',
      })
      caricaVendite()
    } else {
      setErrore(data.error || 'Errore durante la registrazione')
    }
  }

  function euro(n: number) {
    return '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2 })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Vendite</h1>
        <button
          onClick={() => { setShowForm(!showForm); setErrore(''); setMessaggio('') }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nuova vendita
        </button>
      </div>

      {messaggio && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">
          {messaggio}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Registra vendita</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">SKU *</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="es. 42"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Prezzo vendita (€) *</label>
              <input
                type="number"
                value={form.prezzoVendita}
                onChange={(e) => setForm({ ...form, prezzoVendita: e.target.value })}
                placeholder="es. 35.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Data vendita *</label>
              <input
                type="date"
                value={form.dataVendita}
                onChange={(e) => setForm({ ...form, dataVendita: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Venditore (opzionale)</label>
              <select
                value={form.venditore}
                onChange={(e) => setForm({ ...form, venditore: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              >
                <option value="">Nessuno</option>
                {venditori.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          {errore && (
            <p className="text-sm mt-3 text-red-500">{errore}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={registraVendita}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm"
            >
              Registra
            </button>
            <button
              onClick={() => { setShowForm(false); setErrore('') }}
              className="flex-1 border border-gray-200 py-2 rounded-lg text-sm text-gray-700"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Cerca vendita per SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Caricamento...</p>
      ) : venditeFilrate.length === 0 ? (
        <p className="text-sm text-gray-400">Nessuna vendita trovata</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">SKU</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Modello</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Prezzo</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Netto</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Data</th>
              </tr>
            </thead>
            <tbody>
              {venditeFilrate.map((v, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{v.idModello || '—'}</td>
                  <td className="px-4 py-3">{euro(v.prezzoVendita)}</td>
                  <td className="px-4 py-3 text-green-600">{euro(v.guadagnoNetto)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{v.dataVendita}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Vendite() {
  return (
    <Suspense>
      <VenditePage />
    </Suspense>
  )
}