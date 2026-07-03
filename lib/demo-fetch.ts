'use client'

/**
 * Fetch helper — usa SOLO con NEXT_PUBLIC_DEMO_MODE=true.
 * In modalità normale le pagine chiamano direttamente /api/* (dati reali Supabase).
 */
import { isDemoModeClient } from '@/lib/demo'
import {
  demoStockItems,
  demoVendite,
  demoTaglieItems,
  demoCategorie,
  demoConfig,
  getDemoKpi,
  type DemoStockItem,
} from '@/lib/demo-data'

export async function fetchStockItems(): Promise<DemoStockItem[]> {
  if (!isDemoModeClient()) {
    const res = await fetch('/api/stock')
    const data = await res.json()
    return data.items ?? []
  }
  const res = await fetch('/api/stock')
  const data = await res.json()
  return data.items ?? demoStockItems
}

export async function fetchVendite() {
  if (!isDemoModeClient()) {
    const res = await fetch('/api/vendite')
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }
  const res = await fetch('/api/vendite')
  const data = await res.json()
  return Array.isArray(data) ? data : demoVendite
}

export async function fetchTaglie() {
  if (!isDemoModeClient()) {
    const res = await fetch('/api/taglie')
    const data = await res.json()
    return { items: data.items ?? [], categorie: data.categorie ?? [] }
  }
  const res = await fetch('/api/taglie')
  const data = await res.json()
  return {
    items: data.items ?? demoTaglieItems,
    categorie: data.categorie ?? demoCategorie,
  }
}

export async function fetchConfig() {
  if (!isDemoModeClient()) {
    const res = await fetch('/api/config')
    return res.json()
  }
  const res = await fetch('/api/config')
  const data = await res.json()
  return data.venditori ? data : demoConfig
}

export async function fetchDashboardKpi() {
  if (!isDemoModeClient()) {
    const res = await fetch('/api/dashboard')
    const data = await res.json()
    return typeof data.fatturato === 'number' ? data : null
  }
  const res = await fetch('/api/dashboard')
  const data = await res.json()
  return typeof data.fatturato === 'number' ? data : getDemoKpi()
}
