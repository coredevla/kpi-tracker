<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import KpiCard from '@/components/KpiCard.vue'
import BarChart from '@/components/BarChart.vue'
import BaseModal from '@/components/BaseModal.vue'
import { usePersonalStore } from '@/stores/personal'
import { useVentasStore } from '@/stores/ventas'
import { useServiciosStore } from '@/stores/servicios'
import { useAuthStore } from '@/stores/auth'
import { useKpi } from '@/composables/useKpi'
import { currentPeriod, periodLabel, periodsOfYear, formatDateLong } from '@/utils/dates'
import { num, pct, money } from '@/utils/format'
import {
  LayoutDashboard, Target, CheckCircle2, Hourglass, TrendingUp, Sparkles, User, Coins,
} from 'lucide-vue-next'

const personalStore = usePersonalStore()
const ventasStore = useVentasStore()
const serviciosStore = useServiciosStore()
const auth = useAuthStore()
const { activos: personalActivos } = storeToRefs(personalStore)

const periodo = ref(currentPeriod())
const personaId = ref('')

// Gobernanza: el representante queda fijado a su propia persona; el admin elige libremente.
const efectivaPersona = computed(() =>
  auth.isRepresentante ? auth.scopePersonalId : personaId.value || null,
)

const periodOptions = computed(() => {
  const year = Number(periodo.value.slice(0, 4))
  return periodsOfYear(year)
})

const { tarjetas, totales, pri } = useKpi(periodo, efectivaPersona)

const chartData = computed(() => ({
  labels: tarjetas.value.map((t) => t.servicio.nombre),
  datasets: [
    {
      label: 'Objetivo',
      data: tarjetas.value.map((t) => t.objetivo),
      backgroundColor: 'rgba(148,163,184,0.45)',
      borderRadius: 6,
    },
    {
      label: 'Logrado',
      data: tarjetas.value.map((t) => t.logrado),
      backgroundColor: '#3b90f6',
      borderRadius: 6,
    },
  ],
}))

// --- Detalle de servicio ---
const detalle = ref(null)
const detalleOpen = computed({
  get: () => !!detalle.value,
  set: (v) => {
    if (!v) detalle.value = null
  },
})
const detalleKpi = computed(() =>
  detalle.value ? tarjetas.value.find((t) => t.servicio.id === detalle.value.id) : null,
)
const detalleVentas = computed(() => {
  if (!detalle.value) return []
  const criteria = { servicioId: detalle.value.id, periodo: periodo.value }
  if (efectivaPersona.value) criteria.personalId = efectivaPersona.value
  return ventasStore.filter(criteria).slice().sort((a, b) => b.fecha.localeCompare(a.fecha))
})

function openDetail(servicio) {
  detalle.value = servicio
}

function personaNombre(id) {
  return personalStore.byId(id)?.nombre || '—'
}
</script>

<template>
  <div>
    <PageHeader title="Dashboard" subtitle="Cumplimiento de metas por servicio" :icon="LayoutDashboard">
      <template #actions>
        <div class="flex items-center gap-2">
          <select v-if="auth.isAdmin" v-model="personaId" class="input !py-2 !w-44">
            <option value="">Todo el equipo</option>
            <option v-for="p in personalActivos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
          <span v-else class="badge bg-brand-500/10 px-3 py-2 text-brand-600 dark:text-brand-400">
            <User class="h-3.5 w-3.5" /> Mis resultados
          </span>
          <select v-model="periodo" class="input !py-2 !w-40">
            <option v-for="op in periodOptions" :key="op" :value="op">{{ periodLabel(op) }}</option>
          </select>
        </div>
      </template>
    </PageHeader>

    <!-- Totales -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-reveal="0"><StatCard label="Total objetivo" :value="num(totales.objetivo)" :icon="Target" sub="Suma de todos los servicios" /></div>
      <div v-reveal="1"><StatCard label="Total logrado" :value="num(totales.logrado)" :icon="CheckCircle2" accent="from-emerald-500 to-teal-500" :sub="pct(totales.pctLogrado) + ' vs objetivo'" /></div>
      <div v-reveal="2"><StatCard label="Restante" :value="num(totales.restante)" :icon="Hourglass" accent="from-amber-500 to-orange-500" sub="Por alcanzar este periodo" /></div>
      <div v-reveal="3"><StatCard label="Proyectado" :value="num(totales.proyectado)" :icon="TrendingUp" accent="from-violet-500 to-fuchsia-500" :sub="pct(totales.pctProyectado) + ' del objetivo'" /></div>
    </div>

    <!-- PRI · KPI transversal de ingresos -->
    <div v-reveal class="card-surface mt-6 overflow-hidden p-5">
      <div class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow">
            <Coins class="h-6 w-6" />
          </span>
          <div>
            <h2 class="font-bold leading-tight">PRI · Ingresos</h2>
            <p class="text-xs text-slate-400">Suma de montos de la bitácora · {{ periodLabel(periodo) }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-[11px] uppercase tracking-wide text-slate-400">% logrado</p>
          <p class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{{ pct(pri.pctLogrado) }}</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
          <p class="text-[11px] uppercase text-slate-400">Objetivo</p>
          <p class="text-base font-bold">{{ money(pri.objetivo) }}</p>
        </div>
        <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
          <p class="text-[11px] uppercase text-slate-400">Logrado</p>
          <p class="text-base font-bold text-emerald-600 dark:text-emerald-400">{{ money(pri.logrado) }}</p>
        </div>
        <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
          <p class="text-[11px] uppercase text-slate-400">Restante</p>
          <p class="text-base font-bold">{{ money(pri.restante) }}</p>
        </div>
        <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
          <p class="text-[11px] uppercase text-slate-400">Excedente</p>
          <p class="text-base font-bold">{{ money(pri.excedente) }}</p>
        </div>
        <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
          <p class="text-[11px] uppercase text-slate-400">Proyectado</p>
          <p class="text-base font-bold">{{ money(pri.proyectado) }}</p>
        </div>
      </div>
    </div>

    <!-- Gráfico -->
    <div v-reveal class="card-surface mt-6 p-5">
      <div class="mb-4 flex items-center gap-2">
        <Sparkles class="h-5 w-5 text-brand-500" />
        <h2 class="font-bold">Logrado vs Objetivo por servicio</h2>
      </div>
      <BarChart :labels="chartData.labels" :datasets="chartData.datasets" />
    </div>

    <!-- Tarjetas KPI -->
    <h2 class="mb-3 mt-8 text-lg font-bold">Servicios</h2>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="(t, i) in tarjetas" :key="t.servicio.id" v-reveal="i">
        <KpiCard :kpi="t" @detail="openDetail" />
      </div>
    </div>
    <p v-if="!tarjetas.length" class="card-surface mt-4 p-8 text-center text-slate-400">
      No hay servicios activos. Agrégalos en el mantenimiento de Servicios.
    </p>

    <!-- Modal de detalle -->
    <BaseModal v-model="detalleOpen" :title="detalle?.nombre || ''" max-width="max-w-2xl">
      <template v-if="detalleKpi">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
            <p class="text-[11px] uppercase text-slate-400">Objetivo diario</p>
            <p class="text-lg font-bold">{{ num(detalleKpi.objetivoDiario, 1) }}</p>
          </div>
          <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
            <p class="text-[11px] uppercase text-slate-400">Meta diaria</p>
            <p class="text-lg font-bold">{{ num(detalleKpi.metaDiaria, 1) }}</p>
          </div>
          <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
            <p class="text-[11px] uppercase text-slate-400">% Meta diaria</p>
            <p class="text-lg font-bold">{{ pct(detalleKpi.pctMetaDiaria) }}</p>
          </div>
          <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
            <p class="text-[11px] uppercase text-slate-400">Proyectado</p>
            <p class="text-lg font-bold">{{ num(detalleKpi.proyectado, 0) }}</p>
          </div>
          <div class="rounded-xl bg-slate-100/70 p-3 text-center dark:bg-slate-800/60">
            <p class="text-[11px] uppercase text-slate-400">% Proy. vs meta</p>
            <p class="text-lg font-bold">{{ pct(detalleKpi.pctProyectado) }}</p>
          </div>
        </div>

        <h4 class="mb-2 mt-5 text-sm font-bold">Detalle de ventas · {{ periodLabel(periodo) }}</h4>
        <div class="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-slate-800">
              <tr>
                <th class="px-3 py-2">Fecha</th>
                <th class="px-3 py-2">Cliente</th>
                <th class="px-3 py-2">Numeración</th>
                <th class="px-3 py-2 text-center">Cant.</th>
                <th class="px-3 py-2 text-right">Monto</th>
                <th v-if="!efectivaPersona" class="px-3 py-2">Vendedor(a)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in detalleVentas" :key="v.id" class="border-t border-slate-100 dark:border-slate-800">
                <td class="px-3 py-2 whitespace-nowrap">{{ formatDateLong(v.fecha) }}</td>
                <td class="px-3 py-2">{{ v.cliente || '—' }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ v.numeracion || '—' }}</td>
                <td class="px-3 py-2 text-center font-semibold">{{ v.cantidad }}</td>
                <td class="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">{{ money(v.monto) }}</td>
                <td v-if="!efectivaPersona" class="px-3 py-2">{{ personaNombre(v.personalId) }}</td>
              </tr>
              <tr v-if="!detalleVentas.length">
                <td colspan="6" class="px-3 py-6 text-center text-slate-400">Sin ventas registradas en este periodo.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
