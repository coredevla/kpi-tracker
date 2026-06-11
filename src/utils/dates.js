// Utilidades de fecha. Por defecto la semana laboral es Lun-Sáb (excluye domingo).

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Periodo actual en formato YYYY-MM */
export function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

/** Divide un periodo "YYYY-MM" en { year, month0 } (month0 base 0). */
export function parsePeriod(period) {
  const [y, m] = period.split('-').map(Number)
  return { year: y, month0: m - 1 }
}

export function periodLabel(period) {
  const { year, month0 } = parsePeriod(period)
  return `${MESES[month0]} ${year}`
}

function isWorkingDay(date) {
  return date.getDay() !== 0 // 0 = domingo
}

/** Días laborables totales del mes del periodo. */
export function workingDaysInPeriod(period) {
  const { year, month0 } = parsePeriod(period)
  const days = new Date(year, month0 + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    if (isWorkingDay(new Date(year, month0, d))) count++
  }
  return count
}

/**
 * Días laborables transcurridos dentro del periodo hasta hoy (inclusive).
 * - Si el periodo ya pasó: devuelve el total del mes.
 * - Si el periodo es futuro: devuelve 0.
 */
export function workingDaysElapsed(period, ref = new Date()) {
  const { year, month0 } = parsePeriod(period)
  const total = workingDaysInPeriod(period)
  const refY = ref.getFullYear()
  const refM = ref.getMonth()

  if (refY > year || (refY === year && refM > month0)) return total
  if (refY < year || (refY === year && refM < month0)) return 0

  let count = 0
  for (let d = 1; d <= ref.getDate(); d++) {
    if (isWorkingDay(new Date(year, month0, d))) count++
  }
  return count
}

/** Devuelve la lista de periodos YYYY-MM hacia atrás desde `from` (inclusive). */
export function lastPeriods(months, from = currentPeriod()) {
  const { year, month0 } = parsePeriod(from)
  const result = []
  for (let i = 0; i < months; i++) {
    const d = new Date(year, month0 - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

/** Lista de los 12 meses de un año en formato YYYY-MM. */
export function periodsOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
}

export function formatDateLong(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })
}
