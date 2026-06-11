<script setup>
import { computed } from 'vue'
import Card3D from './Card3D.vue'
import ProgressRing from './ProgressRing.vue'
import { num, pct, clampPct } from '@/utils/format'
import { ArrowUpRight, Target, TrendingUp } from 'lucide-vue-next'

const props = defineProps({
  kpi: { type: Object, required: true },
})
const emit = defineEmits(['detail'])

const color = computed(() => props.kpi.servicio.color || '#3b90f6')

const estado = computed(() => {
  const p = props.kpi.pctProyectado
  if (p >= 100) return { label: 'En meta', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' }
  if (p >= 75) return { label: 'En camino', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' }
  return { label: 'En riesgo', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' }
})
</script>

<template>
  <Card3D>
    <div class="card-surface h-full overflow-hidden p-5">
      <div
        class="absolute inset-x-0 top-0 h-1.5"
        :style="{ background: `linear-gradient(90deg, ${color}, transparent)` }"
      />
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <span class="badge" :class="estado.cls">{{ estado.label }}</span>
          <h3 class="mt-2 truncate text-base font-bold text-slate-900 dark:text-white">
            {{ kpi.servicio.nombre }}
          </h3>
          <p class="text-xs text-slate-400">{{ kpi.servicio.categoria }}</p>
        </div>
        <ProgressRing :value="kpi.pctLogrado" :color="color" :size="78" :stroke="8">
          <span class="text-base font-extrabold" :style="{ color }">
            {{ Math.round(kpi.pctLogrado) }}%
          </span>
          <span class="text-[10px] uppercase text-slate-400">logrado</span>
        </ProgressRing>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-slate-100/70 py-2 dark:bg-slate-800/60">
          <p class="text-[10px] uppercase tracking-wide text-slate-400">Objetivo</p>
          <p class="text-lg font-bold text-slate-900 dark:text-white">{{ num(kpi.objetivo) }}</p>
        </div>
        <div class="rounded-xl bg-slate-100/70 py-2 dark:bg-slate-800/60">
          <p class="text-[10px] uppercase tracking-wide text-slate-400">Logrado</p>
          <p class="text-lg font-bold" :style="{ color }">{{ num(kpi.logrado) }}</p>
        </div>
        <div class="rounded-xl bg-slate-100/70 py-2 dark:bg-slate-800/60">
          <p class="text-[10px] uppercase tracking-wide text-slate-400">Restante</p>
          <p class="text-lg font-bold text-slate-900 dark:text-white">{{ num(kpi.restante) }}</p>
        </div>
      </div>

      <div class="mt-4 space-y-2.5 text-sm">
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Target class="h-3.5 w-3.5" /> Meta diaria
          </span>
          <span class="font-semibold">{{ num(kpi.metaDiaria, 1) }}</span>
        </div>
        <div>
          <div class="mb-1 flex items-center justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400">% cumplimiento diario</span>
            <span class="font-semibold">{{ pct(kpi.pctMetaDiaria) }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{ width: `${clampPct(kpi.pctMetaDiaria)}%`, background: color }"
            />
          </div>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <TrendingUp class="h-3.5 w-3.5" /> Proyectado
          </span>
          <span class="font-semibold">
            {{ num(kpi.proyectado, 0) }}
            <span class="text-xs text-slate-400">({{ pct(kpi.pctProyectado) }})</span>
          </span>
        </div>
      </div>

      <button
        class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        @click="emit('detail', kpi.servicio)"
      >
        Ver detalle <ArrowUpRight class="h-4 w-4" />
      </button>
    </div>
  </Card3D>
</template>
