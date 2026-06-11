<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import { useServiciosStore } from '@/stores/servicios'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { CATEGORIAS } from '@/data/seedServicios'
import { num } from '@/utils/format'
import { Boxes, Plus, Pencil, Power, Trash2 } from 'lucide-vue-next'

const store = useServiciosStore()
const run = useAsyncAction()
const showInactivos = ref(false)

const categorias = Object.values(CATEGORIAS)

const lista = computed(() =>
  store.items.filter((s) => (showInactivos.value ? true : s.activo)),
)

const modalOpen = ref(false)
const editId = ref(null)
const form = reactive({
  nombre: '',
  categoria: CATEGORIAS.MOVIL,
  objetivoMensual: 50,
  color: '#3b90f6',
})

function openNew() {
  editId.value = null
  Object.assign(form, { nombre: '', categoria: CATEGORIAS.MOVIL, objetivoMensual: 50, color: '#3b90f6' })
  modalOpen.value = true
}
function openEdit(s) {
  editId.value = s.id
  Object.assign(form, {
    nombre: s.nombre,
    categoria: s.categoria,
    objetivoMensual: s.objetivoMensual,
    color: s.color || '#3b90f6',
  })
  modalOpen.value = true
}
async function save() {
  if (!form.nombre.trim()) return
  const payload = { ...form, objetivoMensual: Number(form.objetivoMensual) || 0 }
  const { ok } = await run(
    () => (editId.value ? store.update(editId.value, payload) : store.create(payload)),
    { success: editId.value ? 'Servicio actualizado.' : 'Servicio creado.' },
  )
  if (ok) modalOpen.value = false
}
async function toggle(s) {
  await run(() => (s.activo ? store.softDelete(s.id) : store.restore(s.id)))
}
async function remove(s) {
  if (confirm(`¿Eliminar definitivamente el servicio "${s.nombre}"?`)) {
    await run(() => store.remove(s.id), { success: 'Servicio eliminado.' })
  }
}
</script>

<template>
  <div>
    <PageHeader title="Servicios (KPI)" subtitle="Catálogo de servicios con su objetivo mensual" :icon="Boxes">
      <template #actions>
        <label class="btn btn-ghost cursor-pointer">
          <input type="checkbox" v-model="showInactivos" class="accent-brand-500" /> Ver inactivos
        </label>
        <button class="btn btn-primary" @click="openNew"><Plus class="h-4 w-4" /> Nuevo servicio</button>
      </template>
    </PageHeader>

    <div class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/80">
          <tr>
            <th class="px-4 py-3">Servicio</th>
            <th class="px-4 py-3">Categoría</th>
            <th class="px-4 py-3 text-right">Objetivo mensual</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(s, i) in lista"
            :key="s.id"
            v-reveal="i"
            class="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
            :class="{ 'opacity-60': !s.activo }"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <span class="h-8 w-1.5 rounded-full" :style="{ background: s.color }" />
                <span class="font-semibold">{{ s.nombre }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ s.categoria }}</td>
            <td class="px-4 py-3 text-right font-bold">{{ num(s.objetivoMensual) }}</td>
            <td class="px-4 py-3 text-center">
              <span class="badge" :class="s.activo ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-400/15 text-slate-500'">
                {{ s.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1.5">
                <button class="btn btn-ghost !px-2.5 !py-2" @click="openEdit(s)"><Pencil class="h-4 w-4" /></button>
                <button class="btn btn-ghost !px-2.5 !py-2" :title="s.activo ? 'Desactivar' : 'Activar'" @click="toggle(s)"><Power class="h-4 w-4" /></button>
                <button class="btn btn-danger !px-2.5 !py-2" @click="remove(s)"><Trash2 class="h-4 w-4" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!lista.length">
            <td colspan="5" class="px-4 py-10 text-center text-slate-400">No hay servicios para mostrar.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-model="modalOpen" :title="editId ? 'Editar servicio' : 'Nuevo servicio'">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Nombre del servicio</label>
          <input v-model="form.nombre" type="text" class="input" required placeholder="Ej. PREPAGO" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Categoría</label>
            <select v-model="form.categoria" class="input">
              <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="label">Objetivo mensual</label>
            <input v-model.number="form.objetivoMensual" type="number" min="0" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Color identificador</label>
          <div class="flex items-center gap-3">
            <input v-model="form.color" type="color" class="h-11 w-16 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700" />
            <span class="font-mono text-sm text-slate-500">{{ form.color }}</span>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ editId ? 'Guardar' : 'Crear' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
