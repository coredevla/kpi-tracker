import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useServiciosStore } from '@/stores/servicios'
import { useAsignacionesStore } from '@/stores/asignaciones'
import { useVentasStore } from '@/stores/ventas'
import { usePriStore } from '@/stores/pri'
import {
  workingDaysInPeriod,
  workingDaysElapsed,
  todayISO,
  currentPeriod,
} from '@/utils/dates'

/**
 * Cálculo puro de los indicadores de un servicio para un periodo.
 *
 * @param {Object} p
 * @param {number} p.objetivo   Objetivo (mensual) del servicio en el periodo
 * @param {number} p.logrado    Cantidad lograda en el periodo
 * @param {number} p.ventasHoy  Cantidad vendida en el día de referencia
 * @param {string} p.periodo    "YYYY-MM"
 */
export function computeKpi({ objetivo = 0, logrado = 0, ventasHoy = 0, periodo = currentPeriod() }) {
  const diasTotales = workingDaysInPeriod(periodo)
  const diasTranscurridos = Math.max(workingDaysElapsed(periodo), 0)
  const diasRestantes = Math.max(diasTotales - diasTranscurridos, 0)

  const restante = Math.max(objetivo - logrado, 0)

  const pctLogrado = objetivo > 0 ? (logrado / objetivo) * 100 : 0

  // Ritmo ideal constante para alcanzar el objetivo.
  const objetivoDiario = diasTotales > 0 ? objetivo / diasTotales : 0

  // Lo que falta vender por día laborable para llegar a la meta.
  const metaDiaria = diasRestantes > 0 ? restante / diasRestantes : restante

  // Cumplimiento del día respecto a la meta diaria requerida.
  const pctMetaDiaria = metaDiaria > 0 ? (ventasHoy / metaDiaria) * 100 : ventasHoy > 0 ? 100 : 0

  // Proyección de cierre de mes según el ritmo actual.
  const proyectado = diasTranscurridos > 0 ? (logrado / diasTranscurridos) * diasTotales : 0
  const pctProyectado = objetivo > 0 ? (proyectado / objetivo) * 100 : 0

  return {
    objetivo,
    logrado,
    restante,
    pctLogrado,
    objetivoDiario,
    metaDiaria,
    ventasHoy,
    pctMetaDiaria,
    proyectado,
    pctProyectado,
    diasTotales,
    diasTranscurridos,
    diasRestantes,
  }
}

/**
 * Composable reactivo del dashboard.
 *
 * @param {import('vue').Ref<string>} periodoRef     periodo activo "YYYY-MM"
 * @param {import('vue').Ref<string|null>} personaRef  id de persona (null = todos)
 */
export function useKpi(periodoRef, personaRef) {
  const serviciosStore = useServiciosStore()
  const asignacionesStore = useAsignacionesStore()
  const ventasStore = useVentasStore()
  const priStore = usePriStore()
  const { activos: serviciosActivos } = storeToRefs(serviciosStore)

  // Objetivo de un servicio en el periodo: suma de asignaciones (filtradas por persona si aplica).
  function objetivoDe(servicioId) {
    const periodo = periodoRef.value
    let asigs = asignacionesStore.forPeriodo(periodo).filter((a) => a.servicioId === servicioId)
    if (personaRef?.value) asigs = asigs.filter((a) => a.personalId === personaRef.value)

    if (asigs.length) {
      return asigs.reduce((acc, a) => acc + (Number(a.objetivoMensual) || 0), 0)
    }
    // Sin asignaciones explícitas: usa el objetivo por defecto del servicio (solo vista global).
    if (!personaRef?.value) {
      return Number(serviciosStore.byId(servicioId)?.objetivoMensual) || 0
    }
    return 0
  }

  const tarjetas = computed(() => {
    const periodo = periodoRef.value
    const hoy = todayISO()
    return serviciosActivos.value.map((servicio) => {
      const criteria = { servicioId: servicio.id, periodo }
      if (personaRef?.value) criteria.personalId = personaRef.value

      const logrado = ventasStore.totalCantidad(criteria)
      const ventasHoy = ventasStore.totalCantidad({ ...criteria, fecha: hoy })
      const objetivo = objetivoDe(servicio.id)

      return {
        servicio,
        ...computeKpi({ objetivo, logrado, ventasHoy, periodo }),
      }
    })
  })

  const totales = computed(() => {
    const t = tarjetas.value.reduce(
      (acc, c) => {
        acc.objetivo += c.objetivo
        acc.logrado += c.logrado
        acc.restante += c.restante
        acc.ventasHoy += c.ventasHoy
        acc.proyectado += c.proyectado
        return acc
      },
      { objetivo: 0, logrado: 0, restante: 0, ventasHoy: 0, proyectado: 0 },
    )
    t.pctLogrado = t.objetivo > 0 ? (t.logrado / t.objetivo) * 100 : 0
    t.pctProyectado = t.objetivo > 0 ? (t.proyectado / t.objetivo) * 100 : 0
    return t
  })

  /**
   * PRI: KPI transversal de ingresos. No depende de un servicio; es la suma de
   * `monto` de toda la bitácora filtrada. Reutiliza `computeKpi` con dinero.
   * El objetivo es por persona (o la suma de todas en vista global).
   */
  const pri = computed(() => {
    const periodo = periodoRef.value
    const hoy = todayISO()
    const criteria = { periodo }
    if (personaRef?.value) criteria.personalId = personaRef.value

    const logrado = ventasStore.totalMonto(criteria)
    const ventasHoy = ventasStore.totalMonto({ ...criteria, fecha: hoy })
    const objetivo = priStore.objetivoPeriodo(periodo, personaRef?.value || null)

    const base = computeKpi({ objetivo, logrado, ventasHoy, periodo })
    // Excedente = cuánto se superó la meta ("milla extra"); visible a nivel persona/global.
    return { ...base, excedente: Math.max(logrado - objetivo, 0) }
  })

  return { tarjetas, totales, pri }
}
