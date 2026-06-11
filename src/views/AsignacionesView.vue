<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import { usePersonalStore } from '@/stores/personal'
import { useServiciosStore } from '@/stores/servicios'
import { useAsignacionesStore } from '@/stores/asignaciones'
import { usePriStore } from '@/stores/pri'
import { useToastStore } from '@/stores/toast'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { currentPeriod, periodLabel, periodsOfYear } from '@/utils/dates'
import { num, money } from '@/utils/format'
import { Link2, Plus, Pencil, Trash2, Wand2, Coins, Save } from 'lucide-vue-next'

const personalStore = usePersonalStore()
const serviciosStore = useServiciosStore()
const asigStore = useAsignacionesStore()
const priStore = usePriStore()
const toast = useToastStore()
const run = useAsyncAction()
const { activos: personalActivos } = storeToRefs(personalStore)
const { activos: serviciosActivos } = storeToRefs(serviciosStore)

const periodo = ref(currentPeriod())
const filtroPersona = ref('')

// --- Metas PRI (ingresos) por persona y periodo ---
// El borrador permite editar el monto antes de guardar; al cambiar de periodo se limpia.
const priDraft = reactive({})
watch(periodo, () => {
  for (const k of Object.keys(priDraft)) delete priDraft[k]
})
function priActual(personalId) {
  return priStore.objetivoDe(personalId, periodo.value)
}
const priTotal = computed(() => priStore.objetivoPeriodo(periodo.value))
async function guardarPri(personalId) {
  const raw = priDraft[personalId]
  const monto = Math.max(Number(raw ?? priActual(personalId)) || 0, 0)
  const existing = priStore.items.find(
    (m) => m.personalId === personalId && m.periodo === periodo.value,
  )
  const { ok } = await run(
    () =>
      existing
        ? priStore.update(existing.id, { objetivoMonto: monto, activo: true })
        : priStore.create({ personalId, periodo: periodo.value, objetivoMonto: monto }),
    { success: 'Meta PRI guardada.' },
  )
  if (ok) delete priDraft[personalId]
}

const periodOptions = computed(() => periodsOfYear(Number(periodo.value.slice(0, 4))))

const lista = computed(() => {
  let items = asigStore.forPeriodo(periodo.value)
  if (filtroPersona.value) items = items.filter((a) => a.personalId === filtroPersona.value)
  return items
})

const modalOpen = ref(false)
const editId = ref(null)
const form = reactive({ personalId: '', servicioId: '', periodo: currentPeriod(), objetivoMensual: 0 })

function openNew() {
  editId.value = null
  Object.assign(form, {
    personalId: filtroPersona.value || personalActivos.value[0]?.id || '',
    servicioId: serviciosActivos.value[0]?.id || '',
    periodo: periodo.value,
    objetivoMensual: serviciosActivos.value[0]?.objetivoMensual || 0,
  })
  modalOpen.value = true
}
function openEdit(a) {
  editId.value = a.id
  Object.assign(form, {
    personalId: a.personalId,
    servicioId: a.servicioId,
    periodo: a.periodo,
    objetivoMensual: a.objetivoMensual,
  })
  modalOpen.value = true
}
async function save() {
  if (!form.personalId || !form.servicioId) return
  const payload = { ...form, objetivoMensual: Number(form.objetivoMensual) || 0 }
  if (!editId.value && asigStore.exists(form.personalId, form.servicioId, form.periodo)) {
    toast.error('Ya existe una asignación de ese servicio para esa persona en el periodo.')
    return
  }
  const { ok } = await run(
    () => (editId.value ? asigStore.update(editId.value, payload) : asigStore.create(payload)),
    { success: editId.value ? 'Asignación actualizada.' : 'Asignación creada.' },
  )
  if (ok) modalOpen.value = false
}
async function remove(a) {
  if (confirm('¿Eliminar esta asignación?')) {
    await run(() => asigStore.remove(a.id), { success: 'Asignación eliminada.' })
  }
}

// Genera asignaciones para una persona con todos los servicios activos (usando su objetivo por defecto).
async function generarTodos() {
  if (!filtroPersona.value) {
    toast.info('Selecciona primero una persona para generar sus asignaciones.')
    return
  }
  const { ok, result } = await run(async () => {
    let creadas = 0
    for (const s of serviciosActivos.value) {
      if (!asigStore.exists(filtroPersona.value, s.id, periodo.value)) {
        await asigStore.create({
          personalId: filtroPersona.value,
          servicioId: s.id,
          periodo: periodo.value,
          objetivoMensual: s.objetivoMensual || 0,
        })
        creadas++
      }
    }
    return creadas
  })
  if (ok) toast.success(`${result} asignación(es) generada(s).`)
}

function nombrePersona(id) {
  return personalStore.byId(id)?.nombre || '—'
}
function servicio(id) {
  return serviciosStore.byId(id)
}
</script>

<template>
  <div>
    <PageHeader title="Asignaciones" subtitle="Vincula cada servicio (KPI) con su objetivo a una persona y periodo" :icon="Link2">
      <template #actions>
        <select v-model="filtroPersona" class="input !py-2 !w-44">
          <option value="">Todo el equipo</option>
          <option v-for="p in personalActivos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
        <select v-model="periodo" class="input !py-2 !w-40">
          <option v-for="op in periodOptions" :key="op" :value="op">{{ periodLabel(op) }}</option>
        </select>
        <button class="btn btn-ghost" @click="generarTodos" title="Generar todas las asignaciones para la persona seleccionada">
          <Wand2 class="h-4 w-4" /> Generar
        </button>
        <button class="btn btn-primary" @click="openNew"><Plus class="h-4 w-4" /> Asignar</button>
      </template>
    </PageHeader>

    <div class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/80">
          <tr>
            <th class="px-4 py-3">Vendedor(a)</th>
            <th class="px-4 py-3">Servicio</th>
            <th class="px-4 py-3 text-right">Objetivo del periodo</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(a, i) in lista"
            :key="a.id"
            v-reveal="i"
            class="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
          >
            <td class="px-4 py-3 font-semibold">{{ nombrePersona(a.personalId) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full" :style="{ background: servicio(a.servicioId)?.color }" />
                {{ servicio(a.servicioId)?.nombre || '—' }}
              </div>
            </td>
            <td class="px-4 py-3 text-right font-bold">{{ num(a.objetivoMensual) }}</td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1.5">
                <button class="btn btn-ghost !px-2.5 !py-2" @click="openEdit(a)"><Pencil class="h-4 w-4" /></button>
                <button class="btn btn-danger !px-2.5 !py-2" @click="remove(a)"><Trash2 class="h-4 w-4" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!lista.length">
            <td colspan="4" class="px-4 py-10 text-center text-slate-400">
              Sin asignaciones para este periodo. Usa “Asignar” o “Generar”.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Metas PRI (ingresos) por persona -->
    <div v-reveal class="card-surface mt-8 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
            <Coins class="h-5 w-5" />
          </span>
          <div>
            <h2 class="font-bold leading-tight">Metas PRI · Ingresos</h2>
            <p class="text-xs text-slate-400">Objetivo en dinero por persona · {{ periodLabel(periodo) }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-[11px] uppercase tracking-wide text-slate-400">Objetivo global del periodo</p>
          <p class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{{ money(priTotal) }}</p>
        </div>
      </div>

      <table class="w-full text-sm">
        <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/80">
          <tr>
            <th class="px-4 py-3">Vendedor(a)</th>
            <th class="px-4 py-3">Meta actual</th>
            <th class="px-4 py-3">Nueva meta (RD$)</th>
            <th class="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in personalActivos"
            :key="p.id"
            class="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
          >
            <td class="px-4 py-3 font-semibold">{{ p.nombre }}</td>
            <td class="px-4 py-3 text-slate-500">{{ money(priActual(p.id)) }}</td>
            <td class="px-4 py-3">
              <input
                type="number"
                min="0"
                step="0.01"
                class="input !py-2 !w-44"
                :value="priDraft[p.id] ?? priActual(p.id)"
                @input="priDraft[p.id] = $event.target.value"
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end">
                <button class="btn btn-primary !px-3 !py-2" @click="guardarPri(p.id)">
                  <Save class="h-4 w-4" /> Guardar
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!personalActivos.length">
            <td colspan="4" class="px-4 py-10 text-center text-slate-400">
              No hay personal activo. Agrégalo en el mantenimiento de Personal.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-model="modalOpen" :title="editId ? 'Editar asignación' : 'Nueva asignación'">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Vendedor(a)</label>
          <select v-model="form.personalId" class="input" required>
            <option value="" disabled>Selecciona…</option>
            <option v-for="p in personalActivos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </div>
        <div>
          <label class="label">Servicio</label>
          <select v-model="form.servicioId" class="input" required>
            <option value="" disabled>Selecciona…</option>
            <option v-for="s in serviciosActivos" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Periodo</label>
            <input v-model="form.periodo" type="month" class="input" required />
          </div>
          <div>
            <label class="label">Objetivo del periodo</label>
            <input v-model.number="form.objetivoMensual" type="number" min="0" class="input" required />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ editId ? 'Guardar' : 'Asignar' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
