<script setup>
import { ref, computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import { usePersonalStore } from '@/stores/personal'
import { useServiciosStore } from '@/stores/servicios'
import { useVentasStore } from '@/stores/ventas'
import { useAuthStore } from '@/stores/auth'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { todayISO, formatDateLong } from '@/utils/dates'
import { num, money } from '@/utils/format'
import { TIPO_GESTION, TIPO_GESTION_LABEL } from '@/data/gestion'
import { NotebookPen, Plus, Trash2, Pencil, CreditCard, User } from 'lucide-vue-next'

const personalStore = usePersonalStore()
const serviciosStore = useServiciosStore()
const ventasStore = useVentasStore()
const auth = useAuthStore()
const run = useAsyncAction()
const { activos: personalActivos } = storeToRefs(personalStore)
const { activos: serviciosActivos } = storeToRefs(serviciosStore)

const fecha = ref(todayISO())
const filtroPersona = ref('')

// Gobernanza: el representante solo trabaja con su propia persona.
const efectivaPersona = computed(() =>
  auth.isRepresentante ? auth.scopePersonalId : filtroPersona.value || null,
)

const modalOpen = ref(false)
const editId = ref(null)
const formError = ref('')
const TIPO_OPTIONS = Object.values(TIPO_GESTION)
const form = reactive({
  personalId: '',
  servicioId: '',
  fecha: todayISO(),
  cantidad: 1,
  monto: 0,
  tipoGestion: TIPO_GESTION.VENTA,
  cliente: '',
  numeracion: '',
  detalle: '',
})

function resetForm() {
  editId.value = null
  formError.value = ''
  Object.assign(form, {
    personalId: auth.scopePersonalId || filtroPersona.value || personalActivos.value[0]?.id || '',
    servicioId: serviciosActivos.value[0]?.id || '',
    fecha: fecha.value,
    cantidad: 1,
    monto: 0,
    tipoGestion: TIPO_GESTION.VENTA,
    cliente: '',
    numeracion: '',
    detalle: '',
  })
}

function openNew() {
  resetForm()
  modalOpen.value = true
}

function openEdit(v) {
  editId.value = v.id
  formError.value = ''
  Object.assign(form, {
    personalId: v.personalId,
    servicioId: v.servicioId,
    fecha: v.fecha,
    cantidad: v.cantidad,
    monto: Number(v.monto) || 0,
    tipoGestion: v.tipoGestion || TIPO_GESTION.VENTA,
    cliente: v.cliente,
    numeracion: v.numeracion,
    detalle: v.detalle,
  })
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  // El representante no puede registrar ventas a nombre de otra persona.
  if (auth.isRepresentante) form.personalId = auth.scopePersonalId
  if (!form.personalId || !form.servicioId) return
  const cantidad = Number(form.cantidad)
  const monto = Number(form.monto)
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    formError.value = 'La cantidad no puede ser negativa.'
    return
  }
  if (!Number.isFinite(monto) || monto < 0) {
    formError.value = 'El monto no puede ser negativo.'
    return
  }
  const payload = { ...form, cantidad, monto, tipoGestion: form.tipoGestion || TIPO_GESTION.VENTA }
  const { ok } = await run(
    () => (editId.value ? ventasStore.update(editId.value, payload) : ventasStore.create(payload)),
    { success: editId.value ? 'Venta actualizada.' : 'Venta registrada.' },
  )
  if (ok) modalOpen.value = false
}

async function remove(id) {
  if (confirm('¿Eliminar este registro de venta?')) {
    await run(() => ventasStore.remove(id), { success: 'Registro eliminado.' })
  }
}

const registrosDelDia = computed(() => {
  const criteria = { fecha: fecha.value }
  if (efectivaPersona.value) criteria.personalId = efectivaPersona.value
  return ventasStore.filter(criteria)
})

// Agrupado por servicio para el resumen del día.
const resumen = computed(() => {
  const map = new Map()
  for (const v of registrosDelDia.value) {
    const s = serviciosStore.byId(v.servicioId)
    if (!map.has(v.servicioId)) {
      map.set(v.servicioId, { servicio: s, total: 0, monto: 0, ventas: [] })
    }
    const g = map.get(v.servicioId)
    g.total += Number(v.cantidad) || 0
    g.monto += Number(v.monto) || 0
    g.ventas.push(v)
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
})

const totalDia = computed(() => registrosDelDia.value.reduce((a, v) => a + (Number(v.cantidad) || 0), 0))
const totalMontoDia = computed(() => registrosDelDia.value.reduce((a, v) => a + (Number(v.monto) || 0), 0))

function tipoLabel(t) {
  return TIPO_GESTION_LABEL[t || TIPO_GESTION.VENTA]
}

function nombre(id) {
  return personalStore.byId(id)?.nombre || '—'
}
</script>

<template>
  <div>
    <PageHeader title="Bitácora diaria" subtitle="Registro de cada servicio vendido (CARD, líneas, etc.)" :icon="NotebookPen">
      <template #actions>
        <select v-if="auth.isAdmin" v-model="filtroPersona" class="input !py-2 !w-44">
          <option value="">Todo el equipo</option>
          <option v-for="p in personalActivos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
        <span v-else class="badge bg-brand-500/10 px-3 py-2 text-brand-600 dark:text-brand-400">
          <User class="h-3.5 w-3.5" /> Mis ventas
        </span>
        <input type="date" v-model="fecha" class="input !py-2 !w-44" />
        <button class="btn btn-primary" @click="openNew"><Plus class="h-4 w-4" /> Registrar venta</button>
      </template>
    </PageHeader>

    <div v-reveal class="card-surface mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ formatDateLong(fecha) }}</p>
        <p class="text-2xl font-extrabold">{{ num(totalDia) }} <span class="text-base font-medium text-slate-400">ventas en el día</span></p>
        <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{{ money(totalMontoDia) }} <span class="font-normal text-slate-400">en ingresos (PRI)</span></p>
      </div>
      <div class="flex flex-wrap gap-2">
        <span v-for="g in resumen" :key="g.servicio?.id" class="badge bg-brand-500/10 text-brand-600 dark:text-brand-400">
          {{ g.servicio?.nombre }}: {{ g.total }}
        </span>
      </div>
    </div>

    <div v-if="!resumen.length" class="card-surface p-10 text-center text-slate-400">
      No hay ventas registradas para este día. Usa “Registrar venta”.
    </div>

    <div class="space-y-5">
      <div v-for="(g, i) in resumen" :key="g.servicio?.id" v-reveal="i" class="card-surface overflow-hidden">
        <div
          class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800"
          :style="{ borderLeft: `4px solid ${g.servicio?.color || '#3b90f6'}` }"
        >
          <h3 class="font-bold">{{ g.servicio?.nombre }}</h3>
          <div class="flex items-center gap-2">
            <span class="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{{ money(g.monto) }}</span>
            <span class="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ g.total }} ventas</span>
          </div>
        </div>
        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          <div v-for="v in g.ventas" :key="v.id" class="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
              <CreditCard class="h-4.5 w-4.5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">
                {{ v.cliente || 'Cliente sin nombre' }}
                <span
                  class="badge ml-1 align-middle text-[10px]"
                  :class="(v.tipoGestion || 'venta') === 'reclamacion' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'"
                >{{ tipoLabel(v.tipoGestion) }}</span>
              </p>
              <p class="truncate text-xs text-slate-400">
                <span v-if="v.numeracion" class="font-mono">#{{ v.numeracion }}</span>
                <span v-if="v.detalle"> · {{ v.detalle }}</span>
                <span class="inline-flex items-center gap-1"> · <User class="h-3 w-3" />{{ nombre(v.personalId) }}</span>
              </p>
            </div>
            <span class="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{{ money(v.monto) }}</span>
            <span class="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">x{{ v.cantidad }}</span>
            <button class="btn btn-ghost !px-2 !py-2" @click="openEdit(v)"><Pencil class="h-4 w-4" /></button>
            <button class="btn btn-danger !px-2 !py-2" @click="remove(v.id)"><Trash2 class="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model="modalOpen" :title="editId ? 'Editar venta' : 'Registrar venta'">
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Vendedor(a)</label>
            <select v-if="auth.isAdmin" v-model="form.personalId" class="input" required>
              <option value="" disabled>Selecciona…</option>
              <option v-for="p in personalActivos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
            <input v-else class="input" :value="personalStore.byId(auth.scopePersonalId)?.nombre || ''" disabled />
          </div>
          <div>
            <label class="label">Servicio</label>
            <select v-model="form.servicioId" class="input" required>
              <option value="" disabled>Selecciona…</option>
              <option v-for="s in serviciosActivos" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="label">Fecha</label>
            <input type="date" v-model="form.fecha" class="input" required />
          </div>
          <div>
            <label class="label">Tipo de gestión</label>
            <select v-model="form.tipoGestion" class="input">
              <option v-for="t in TIPO_OPTIONS" :key="t" :value="t">{{ TIPO_GESTION_LABEL[t] }}</option>
            </select>
          </div>
          <div>
            <label class="label">Cantidad</label>
            <input type="number" min="0" step="1" v-model.number="form.cantidad" class="input" required />
          </div>
          <div>
            <label class="label">Monto (RD$)</label>
            <input type="number" min="0" step="0.01" v-model.number="form.monto" class="input" placeholder="0.00" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Nombre del cliente / usuario</label>
            <input type="text" v-model="form.cliente" class="input" placeholder="Ej. Juan Pérez" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Numeración (tarjeta / línea / contrato)</label>
            <input type="text" v-model="form.numeracion" class="input" placeholder="Ej. 8095551234 / CARD-00123" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Detalle (opcional)</label>
            <textarea v-model="form.detalle" rows="2" class="input" placeholder="Observaciones…" />
          </div>
        </div>
        <div v-if="formError" class="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          {{ formError }}
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ editId ? 'Guardar cambios' : 'Registrar' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
