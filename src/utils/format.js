export function num(value, decimals = 0) {
  const n = Number(value) || 0
  return n.toLocaleString('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Moneda local: RD$ con 2 decimales.
export function money(value, decimals = 2) {
  const n = Number(value) || 0
  return `RD$ ${n.toLocaleString('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function pct(value, decimals = 1) {
  const n = Number(value) || 0
  return `${n.toLocaleString('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`
}

export function clampPct(value) {
  const n = Number(value) || 0
  return Math.max(0, Math.min(100, n))
}
