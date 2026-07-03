/** Demo mode: SOLO se esplicitamente attivato. Mai sostituisce dati reali. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function isDemoModeClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}
