<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import * as XLSX from 'xlsx'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import BarChart from '@/components/BarChart.vue'
import { usePersonalStore } from '@/stores/personal'
import { useServiciosStore } from '@/stores/servicios'
import { useAsignacionesStore } from '@/stores/asignaciones'
import { useVentasStore } from '@/stores/ventas'
import { usePriStore } from '@/stores/pri'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { friendlyError } from '@/utils/errors'
import { lastPeriods, periodLabel, currentPeriod } from '@/utils/dates'
import { num, pct, money } from '@/utils/format'
import { TIPO_GESTION, TIPO_GESTION_LABEL } from '@/data/gestion'
import { BarChart3, Trophy, CalendarRange, CheckCircle2, Download, Upload, Medal, User, Coins, FileSpreadsheet } from 'lucide-vue-next'

const personalStore = usePersonalStore()
const serviciosStore = useServiciosStore()
const asigStore = useAsignacionesStore()
const ventasStore = useVentasStore()
const priStore = usePriStore()
const app = useAppStore()
const auth = useAuthStore()
const toast = useToastStore()
const { activos: personalActivos } = storeToRefs(personalStore)
const { activos: serviciosActivos } = storeToRefs(serviciosStore)

const rango = ref(6) // 3, 6, 12 meses
const personaId = ref('')
const tipoFiltro = ref('') // '' = todas; o venta/reclamacion

// Gobernanza: el representante solo ve su propio performance.
const efectivaPersona = computed(() =>
  auth.isRepresentante ? auth.scopePersonalId : personaId.value || null,
)

const periodos = computed(() => lastPeriods(Number(rango.value), currentPeriod()).slice().reverse())

// Construye el criterio respetando persona en alcance y filtro de tipo de gestión.
function buildCriteria(extra = {}) {
  const c = { ...extra }
  if (efectivaPersona.value) c.personalId = efectivaPersona.value
  if (tipoFiltro.value) c.tipoGestion = tipoFiltro.value
  return c
}

function objetivoPeriodo(periodo) {
  let asigs = asigStore.forPeriodo(periodo)
  if (efectivaPersona.value) asigs = asigs.filter((a) => a.personalId === efectivaPersona.value)
  if (asigs.length) return asigs.reduce((acc, a) => acc + (Number(a.objetivoMensual) || 0), 0)
  if (!efectivaPersona.value) {
    return serviciosActivos.value.reduce((acc, s) => acc + (Number(s.objetivoMensual) || 0), 0)
  }
  return 0
}
function logradoPeriodo(periodo) {
  return ventasStore.totalCantidad(buildCriteria({ periodo }))
}
function montoPeriodo(periodo) {
  return ventasStore.totalMonto(buildCriteria({ periodo }))
}

const filas = computed(() =>
  periodos.value.map((p) => {
    const objetivo = objetivoPeriodo(p)
    const logrado = logradoPeriodo(p)
    return {
      periodo: p,
      label: periodLabel(p),
      objetivo,
      logrado,
      monto: montoPeriodo(p),
      pct: objetivo > 0 ? (logrado / objetivo) * 100 : 0,
    }
  }),
)

// --- PRI (ingresos) en el rango ---
const priLogradoRango = computed(() => periodos.value.reduce((a, p) => a + montoPeriodo(p), 0))
const priObjetivoRango = computed(() =>
  periodos.value.reduce((a, p) => a + priStore.objetivoPeriodo(p, efectivaPersona.value || null), 0),
)
const priExcedenteRango = computed(() => Math.max(priLogradoRango.value - priObjetivoRango.value, 0))
const pctPriRango = computed(() =>
  priObjetivoRango.value > 0 ? (priLogradoRango.value / priObjetivoRango.value) * 100 : 0,
)

// --- Tabla por persona/servicio (cantidad + monto + % contribución al PRI) ---
const tablaPersonaServicio = computed(() => {
  const personas = efectivaPersona.value
    ? personalActivos.value.filter((p) => p.id === efectivaPersona.value)
    : personalActivos.value
  const rows = []
  for (const p of personas) {
    for (const s of serviciosActivos.value) {
      let cantidad = 0
      let monto = 0
      for (const per of periodos.value) {
        const c = buildCriteria({ personalId: p.id, servicioId: s.id, periodo: per })
        cantidad += ventasStore.totalCantidad(c)
        monto += ventasStore.totalMonto(c)
      }
      if (cantidad > 0 || monto > 0) rows.push({ persona: p, servicio: s, cantidad, monto })
    }
  }
  const totalMonto = rows.reduce((a, r) => a + r.monto, 0)
  rows.forEach((r) => {
    r.pctPri = totalMonto > 0 ? (r.monto / totalMonto) * 100 : 0
  })
  return rows.sort((a, b) => b.monto - a.monto)
})
const totalTablaCantidad = computed(() => tablaPersonaServicio.value.reduce((a, r) => a + r.cantidad, 0))
const totalTablaMonto = computed(() => tablaPersonaServicio.value.reduce((a, r) => a + r.monto, 0))

const totalLogrado = computed(() => filas.value.reduce((a, f) => a + f.logrado, 0))
const totalObjetivo = computed(() => filas.value.reduce((a, f) => a + f.objetivo, 0))
const promedioCumplimiento = computed(() => {
  const v = filas.value.filter((f) => f.objetivo > 0)
  return v.length ? v.reduce((a, f) => a + f.pct, 0) / v.length : 0
})
const mejorMes = computed(() => {
  if (!filas.value.length) return null
  return filas.value.slice().sort((a, b) => b.logrado - a.logrado)[0]
})

const chart = computed(() => ({
  labels: filas.value.map((f) => f.label),
  datasets: [
    { label: 'Objetivo', data: filas.value.map((f) => f.objetivo), backgroundColor: 'rgba(148,163,184,0.45)', borderRadius: 6 },
    { label: 'Logrado', data: filas.value.map((f) => f.logrado), backgroundColor: '#14b8a6', borderRadius: 6 },
  ],
}))

// Desglose por servicio en el rango.
const porServicio = computed(() =>
  serviciosActivos.value
    .map((s) => {
      let logrado = 0
      let monto = 0
      for (const p of periodos.value) {
        const criteria = buildCriteria({ servicioId: s.id, periodo: p })
        logrado += ventasStore.totalCantidad(criteria)
        monto += ventasStore.totalMonto(criteria)
      }
      return { servicio: s, logrado, monto }
    })
    .sort((a, b) => b.logrado - a.logrado),
)

// Ranking de vendedoras (solo cuando se ve todo el equipo).
const ranking = computed(() => {
  if (efectivaPersona.value) return []
  return personalActivos.value
    .map((p) => {
      let logrado = 0
      let monto = 0
      for (const per of periodos.value) {
        const c = { personalId: p.id, periodo: per }
        if (tipoFiltro.value) c.tipoGestion = tipoFiltro.value
        logrado += ventasStore.totalCantidad(c)
        monto += ventasStore.totalMonto(c)
      }
      return { persona: p, logrado, monto }
    })
    .sort((a, b) => b.logrado - a.logrado)
})

const TIPO_OPTIONS = Object.values(TIPO_GESTION)

// --- Respaldo ---
const fileInput = ref(null)

async function exportar() {
  try {
    const data = await app.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kpi-tracker-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Respaldo exportado.')
  } catch (e) {
    toast.error(friendlyError(e, 'No se pudo exportar el respaldo.'))
  }
}

// Exporta el reporte completo a Excel (cantidad, monto, tipo de gestión y métricas PRI).
function exportarExcel() {
  try {
  const wb = XLSX.utils.book_new()
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100

  const hojaMes = filas.value.map((f) => ({
    Mes: f.label,
    Objetivo: f.objetivo,
    'Logrado (cant.)': f.logrado,
    'Monto (RD$)': r2(f.monto),
    '% Cumplimiento': r2(f.pct),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaMes), 'Por mes')

  const hojaPS = tablaPersonaServicio.value.map((r) => ({
    Persona: r.persona.nombre,
    Servicio: r.servicio.nombre,
    Cantidad: r.cantidad,
    'Monto (RD$)': r2(r.monto),
    '% Contribución PRI': r2(r.pctPri),
  }))
  hojaPS.push({
    Persona: 'TOTAL',
    Servicio: '',
    Cantidad: totalTablaCantidad.value,
    'Monto (RD$)': r2(totalTablaMonto.value),
    '% Contribución PRI': 100,
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaPS), 'Persona-Servicio')

  const hojaPri = (efectivaPersona.value ? personalActivos.value.filter((p) => p.id === efectivaPersona.value) : personalActivos.value).map((p) => {
    let logrado = 0
    for (const per of periodos.value) {
      const c = { personalId: p.id, periodo: per }
      if (tipoFiltro.value) c.tipoGestion = tipoFiltro.value
      logrado += ventasStore.totalMonto(c)
    }
    const objetivo = periodos.value.reduce((a, per) => a + priStore.objetivoPeriodo(per, p.id), 0)
    return {
      Persona: p.nombre,
      'Objetivo PRI (RD$)': r2(objetivo),
      'Logrado PRI (RD$)': r2(logrado),
      'Restante (RD$)': r2(Math.max(objetivo - logrado, 0)),
      'Excedente (RD$)': r2(Math.max(logrado - objetivo, 0)),
      '% Cumplimiento': r2(objetivo > 0 ? (logrado / objetivo) * 100 : 0),
    }
  })
  hojaPri.push({
    Persona: 'TOTAL EQUIPO',
    'Objetivo PRI (RD$)': r2(priObjetivoRango.value),
    'Logrado PRI (RD$)': r2(priLogradoRango.value),
    'Restante (RD$)': r2(Math.max(priObjetivoRango.value - priLogradoRango.value, 0)),
    'Excedente (RD$)': r2(priExcedenteRango.value),
    '% Cumplimiento': r2(pctPriRango.value),
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaPri), 'PRI por persona')

  const tipo = tipoFiltro.value ? `-${tipoFiltro.value}` : ''
  XLSX.writeFile(wb, `kpi-tracker-reporte${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Reporte exportado a Excel.')
  } catch (e) {
    toast.error(friendlyError(e, 'No se pudo exportar el Excel.'))
  }
}

function importar(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const json = JSON.parse(reader.result)
      if (confirm('Esto reemplazará TODOS los datos actuales por los del respaldo. ¿Continuar?')) {
        await app.importData(json)
        toast.success('Respaldo importado correctamente.')
      }
    } catch (err) {
      toast.error(friendlyError(err, 'El archivo de respaldo no es válido.'))
    }
    e.target.value = ''
  }
  reader.readAsText(file)
}

const medalColor = ['#facc15', '#cbd5e1', '#d97706']
</script>

<template>
  <div>
    <PageHeader title="Reportes" subtitle="Performance por mes y cortes de 3, 6 o 12 meses" :icon="BarChart3">
      <template #actions>
        <select v-if="auth.isAdmin" v-model="personaId" class="input !py-2 !w-44">
          <option value="">Todo el equipo</option>
          <option v-for="p in personalActivos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
        <span v-else class="badge bg-brand-500/10 px-3 py-2 text-brand-600 dark:text-brand-400">
          <User class="h-3.5 w-3.5" /> Mi performance
        </span>
        <select v-model="tipoFiltro" class="input !py-2 !w-44">
          <option value="">Todas las gestiones</option>
          <option v-for="t in TIPO_OPTIONS" :key="t" :value="t">{{ TIPO_GESTION_LABEL[t] }}</option>
        </select>
        <select v-model="rango" class="input !py-2 !w-40">
          <option :value="3">Últimos 3 meses</option>
          <option :value="6">Últimos 6 meses</option>
          <option :value="12">Últimos 12 meses</option>
        </select>
        <button class="btn btn-ghost" @click="exportarExcel" title="Exportar reporte a Excel"><FileSpreadsheet class="h-4 w-4" /> Excel</button>
        <template v-if="auth.isAdmin">
          <button class="btn btn-ghost" @click="exportar" title="Exportar respaldo"><Download class="h-4 w-4" /> Exportar</button>
          <button class="btn btn-ghost" @click="fileInput.click()" title="Importar respaldo"><Upload class="h-4 w-4" /> Importar</button>
          <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="importar" />
        </template>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-reveal="0"><StatCard label="Logrado en el rango" :value="num(totalLogrado)" :icon="CheckCircle2" accent="from-emerald-500 to-teal-500" :sub="`Objetivo: ${num(totalObjetivo)}`" /></div>
      <div v-reveal="1"><StatCard label="Cumplimiento promedio" :value="pct(promedioCumplimiento)" :icon="BarChart3" :sub="`${periodos.length} meses`" /></div>
      <div v-reveal="2"><StatCard label="Mejor mes" :value="mejorMes ? num(mejorMes.logrado) : '—'" :icon="Trophy" accent="from-amber-500 to-orange-500" :sub="mejorMes ? mejorMes.label : ''" /></div>
      <div v-reveal="3"><StatCard label="Periodos analizados" :value="periodos.length" :icon="CalendarRange" accent="from-violet-500 to-fuchsia-500" sub="Cortes mensuales" /></div>
    </div>

    <!-- PRI · Ingresos en el rango -->
    <div v-reveal class="card-surface mt-6 overflow-hidden p-5">
      <div class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div class="mb-4 flex items-center gap-2">
        <Coins class="h-5 w-5 text-emerald-500" />
        <h2 class="font-bold">PRI · Ingresos del rango ({{ periodos.length }} meses)</h2>
      </div>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Objetivo PRI" :value="money(priObjetivoRango)" :icon="Coins" :sub="efectivaPersona ? 'Meta de la persona' : 'Suma del equipo'" />
        <StatCard label="Logrado PRI" :value="money(priLogradoRango)" :icon="CheckCircle2" accent="from-emerald-500 to-teal-500" :sub="pct(pctPriRango) + ' del objetivo'" />
        <StatCard label="Excedente" :value="money(priExcedenteRango)" :icon="Trophy" accent="from-amber-500 to-orange-500" sub="Por encima de la meta" />
        <StatCard label="% Cumplimiento PRI" :value="pct(pctPriRango)" :icon="BarChart3" accent="from-violet-500 to-fuchsia-500" sub="Puede superar 100%" />
      </div>
    </div>

    <div v-reveal class="card-surface mt-6 p-5">
      <h2 class="mb-4 font-bold">Evolución mensual · Logrado vs Objetivo</h2>
      <BarChart :labels="chart.labels" :datasets="chart.datasets" />
    </div>

    <!-- Tabla por persona/servicio -->
    <div v-reveal class="card-surface mt-6 overflow-hidden">
      <h2 class="border-b border-slate-100 px-5 py-3 font-bold dark:border-slate-800">
        Detalle por persona / servicio
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/80">
            <tr>
              <th class="px-4 py-2.5">Persona</th>
              <th class="px-4 py-2.5">Servicio</th>
              <th class="px-4 py-2.5 text-right">Cantidad</th>
              <th class="px-4 py-2.5 text-right">Monto</th>
              <th class="px-4 py-2.5 text-right">% PRI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in tablaPersonaServicio" :key="r.persona.id + '-' + r.servicio.id" v-reveal="i" class="border-t border-slate-100 dark:border-slate-800">
              <td class="px-4 py-2.5 font-medium">{{ r.persona.nombre }}</td>
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full" :style="{ background: r.servicio.color }" />
                  {{ r.servicio.nombre }}
                </div>
              </td>
              <td class="px-4 py-2.5 text-right font-semibold">{{ num(r.cantidad) }}</td>
              <td class="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">{{ money(r.monto) }}</td>
              <td class="px-4 py-2.5 text-right">{{ pct(r.pctPri) }}</td>
            </tr>
            <tr v-if="!tablaPersonaServicio.length">
              <td colspan="5" class="px-4 py-10 text-center text-slate-400">Sin registros para los filtros seleccionados.</td>
            </tr>
          </tbody>
          <tfoot v-if="tablaPersonaServicio.length" class="border-t-2 border-slate-200 font-bold dark:border-slate-700">
            <tr>
              <td class="px-4 py-3" colspan="2">Total</td>
              <td class="px-4 py-3 text-right">{{ num(totalTablaCantidad) }}</td>
              <td class="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{{ money(totalTablaMonto) }}</td>
              <td class="px-4 py-3 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Tabla por mes -->
      <div v-reveal class="card-surface overflow-hidden">
        <h2 class="border-b border-slate-100 px-5 py-3 font-bold dark:border-slate-800">Detalle por mes</h2>
        <table class="w-full text-sm">
          <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/80">
            <tr>
              <th class="px-4 py-2.5">Mes</th>
              <th class="px-4 py-2.5 text-right">Objetivo</th>
              <th class="px-4 py-2.5 text-right">Logrado</th>
              <th class="px-4 py-2.5 text-right">% Cumpl.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in filas" :key="f.periodo" class="border-t border-slate-100 dark:border-slate-800">
              <td class="px-4 py-2.5 font-medium">{{ f.label }}</td>
              <td class="px-4 py-2.5 text-right">{{ num(f.objetivo) }}</td>
              <td class="px-4 py-2.5 text-right font-semibold">{{ num(f.logrado) }}</td>
              <td class="px-4 py-2.5 text-right">
                <span class="badge" :class="f.pct >= 100 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : f.pct >= 75 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'">
                  {{ pct(f.pct) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Por servicio o ranking -->
      <div v-reveal class="card-surface overflow-hidden">
        <h2 class="border-b border-slate-100 px-5 py-3 font-bold dark:border-slate-800">
          {{ efectivaPersona ? 'Logrado por servicio' : 'Ranking de vendedoras' }}
        </h2>

        <table v-if="efectivaPersona" class="w-full text-sm">
          <tbody>
            <tr v-for="row in porServicio" :key="row.servicio.id" class="border-t border-slate-100 dark:border-slate-800">
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full" :style="{ background: row.servicio.color }" />
                  {{ row.servicio.nombre }}
                </div>
              </td>
              <td class="px-4 py-2.5 text-right">
                <span class="font-bold">{{ num(row.logrado) }}</span>
                <span class="ml-2 text-xs text-emerald-600 dark:text-emerald-400">{{ money(row.monto) }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="(r, i) in ranking" :key="r.persona.id" class="flex items-center gap-3 px-5 py-3">
            <span class="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" :style="{ background: medalColor[i] || '#64748b' }">
              <Medal v-if="i < 3" class="h-4 w-4" /><template v-else>{{ i + 1 }}</template>
            </span>
            <span class="flex-1 font-medium">{{ r.persona.nombre }}</span>
            <span class="text-right">
              <span class="block text-lg font-bold leading-tight">{{ num(r.logrado) }}</span>
              <span class="block text-xs text-emerald-600 dark:text-emerald-400">{{ money(r.monto) }}</span>
            </span>
          </li>
          <li v-if="!ranking.length" class="px-5 py-8 text-center text-slate-400">Sin datos de personal.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
