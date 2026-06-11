<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import { usePersonalStore } from '@/stores/personal'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { todayISO, formatDateLong } from '@/utils/dates'
import { Users, Plus, Pencil, Power, Trash2, UserCheck } from 'lucide-vue-next'

const store = usePersonalStore()
const run = useAsyncAction()
const showInactivos = ref(false)

const lista = computed(() =>
  store.items.filter((p) => (showInactivos.value ? true : p.activo)),
)

const modalOpen = ref(false)
const editId = ref(null)
const form = reactive({ nombre: '', cargo: 'Vendedor(a)', equipo: '', fechaIngreso: todayISO() })

function openNew() {
  editId.value = null
  Object.assign(form, { nombre: '', cargo: 'Vendedor(a)', equipo: '', fechaIngreso: todayISO() })
  modalOpen.value = true
}
function openEdit(p) {
  editId.value = p.id
  Object.assign(form, { nombre: p.nombre, cargo: p.cargo, equipo: p.equipo, fechaIngreso: p.fechaIngreso })
  modalOpen.value = true
}
async function save() {
  if (!form.nombre.trim()) return
  const { ok } = await run(
    () => (editId.value ? store.update(editId.value, { ...form }) : store.create({ ...form })),
    { success: editId.value ? 'Personal actualizado.' : 'Personal creado.' },
  )
  if (ok) modalOpen.value = false
}
async function toggle(p) {
  await run(() => (p.activo ? store.softDelete(p.id) : store.restore(p.id)))
}
async function remove(p) {
  if (confirm(`¿Eliminar definitivamente a ${p.nombre}? Esta acción no se puede deshacer.`)) {
    await run(() => store.remove(p.id), { success: 'Personal eliminado.' })
  }
}

function initials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <div>
    <PageHeader title="Personal" subtitle="Recurso humano al que se asignan los KPIs" :icon="Users">
      <template #actions>
        <label class="btn btn-ghost cursor-pointer">
          <input type="checkbox" v-model="showInactivos" class="accent-brand-500" /> Ver inactivos
        </label>
        <button class="btn btn-primary" @click="openNew"><Plus class="h-4 w-4" /> Nuevo</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(p, i) in lista"
        :key="p.id"
        v-reveal="i"
        class="card-surface p-5"
        :class="{ 'opacity-60': !p.activo }"
      >
        <div class="flex items-center gap-3">
          <span class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 font-bold text-white">
            {{ initials(p.nombre) }}
          </span>
          <div class="min-w-0">
            <h3 class="truncate font-bold">{{ p.nombre }}</h3>
            <p class="text-xs text-slate-400">{{ p.cargo }}<span v-if="p.equipo"> · {{ p.equipo }}</span></p>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <span class="badge" :class="p.activo ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-400/15 text-slate-500'">
            <UserCheck class="h-3 w-3" /> {{ p.activo ? 'Activo' : 'Inactivo' }}
          </span>
          <span class="text-xs text-slate-400">Ingreso: {{ formatDateLong(p.fechaIngreso) }}</span>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="btn btn-ghost flex-1" @click="openEdit(p)"><Pencil class="h-4 w-4" /> Editar</button>
          <button class="btn btn-ghost !px-3" :title="p.activo ? 'Desactivar' : 'Activar'" @click="toggle(p)"><Power class="h-4 w-4" /></button>
          <button class="btn btn-danger !px-3" title="Eliminar" @click="remove(p)"><Trash2 class="h-4 w-4" /></button>
        </div>
      </div>
    </div>

    <p v-if="!lista.length" class="card-surface p-10 text-center text-slate-400">
      No hay personal registrado. Crea el primero con “Nuevo”.
    </p>

    <BaseModal v-model="modalOpen" :title="editId ? 'Editar personal' : 'Nuevo personal'">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Nombre completo</label>
          <input v-model="form.nombre" type="text" class="input" required placeholder="Ej. María Rodríguez" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Cargo</label>
            <input v-model="form.cargo" type="text" class="input" placeholder="Vendedor(a)" />
          </div>
          <div>
            <label class="label">Equipo / Tienda</label>
            <input v-model="form.equipo" type="text" class="input" placeholder="Ej. Tienda Centro" />
          </div>
        </div>
        <div>
          <label class="label">Fecha de ingreso</label>
          <input v-model="form.fechaIngreso" type="date" class="input" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ editId ? 'Guardar' : 'Crear' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
