'use client'

import { useState, useEffect } from 'react'
import { Venditore } from '@/lib/types'

export default function Config() {
  const [venditori, setVenditori] = useState<Venditore[]>([])
  const [categorie, setCategorie] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [nuovoVenditore, setNuovoVenditore] = useState({ nome: '', fee: '' })
  const [nuovaCategoria, setNuovaCategoria] = useState('')
  const [messaggio, setMessaggio] = useState('')

  useEffect(() => {
    caricaConfig()
  }, [])

  function caricaConfig() {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setVenditori(data.venditori.filter((v: Venditore) => v.nome))
        setCategorie(data.categorie.filter((c: string) => c))
        setLoading(false)
      })
  }

  async function aggiungiVenditore() {
    if (!nuovoVenditore.nome) return
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'venditore',
        valore: nuovoVenditore.nome,
        fee: parseFloat(nuovoVenditore.fee) || 0,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setMessaggio('Venditore aggiunto!')
      setNuovoVenditore({ nome: '', fee: '' })
      caricaConfig()
    }
  }

  async function aggiungiCategoria() {
    if (!nuovaCategoria) return
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'categoria',
        valore: nuovaCategoria,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setMessaggio('Categoria aggiunta!')
      setNuovaCategoria('')
      caricaConfig()
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Caricamento...</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Configurazione</h1>
      </div>

      {messaggio && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">
          {messaggio}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Venditori</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {venditori.map((v, i) => (
            <div key={i} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-900">{v.nome}</span>
              <span className="text-gray-500">Fee {v.feePercentuale}%</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
          <input
            type="text"
            placeholder="Nome venditore"
            value={nuovoVenditore.nome}
            onChange={(e) => setNuovoVenditore({ ...nuovoVenditore, nome: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <input
            type="number"
            placeholder="Fee % (es. 15)"
            value={nuovoVenditore.fee}
            onChange={(e) => setNuovoVenditore({ ...nuovoVenditore, fee: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <button
            onClick={aggiungiVenditore}
            className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm"
          >
            + Aggiungi venditore
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Categorie prodotto</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {categorie.map((c, i) => (
            <div key={i} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-900">{c}</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Attiva</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
          <input
            type="text"
            placeholder="Nome categoria (es. Giacca)"
            value={nuovaCategoria}
            onChange={(e) => setNuovaCategoria(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <button
            onClick={aggiungiCategoria}
            className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm"
          >
            + Aggiungi categoria
          </button>
        </div>
      </div>
    </div>
  )
}