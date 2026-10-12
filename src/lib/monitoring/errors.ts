const state = globalThis as typeof globalThis & { sibTradeErrorCounts?: { startedAt: string; count: number; lastAt: string | null } }
export function errorCounts() { return state.sibTradeErrorCounts ??= { startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(), count: 0, lastAt: null } }
export function recordServerError() { const counts = errorCounts(); counts.count++; counts.lastAt = new Date().toISOString() }
