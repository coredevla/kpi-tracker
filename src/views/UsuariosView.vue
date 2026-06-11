<script setup>
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import BaseModal from '@/components/BaseModal.vue'
import { useUsuariosStore } from '@/stores/usuarios'
import { usePersonalStore } from '@/stores/personal'
import { useAuthStore } from '@/stores/auth'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { friendlyError } from '@/utils/errors'
import { ROLES, ROLE_LABEL } from '@/data/roles'
import { UserCog, Plus, Pencil, Power, KeyRound, Mail, ShieldCheck } from 'lucide-vue-next'

const usuariosStore = useUsuariosStore()
const personalStore = usePersonalStore()
const auth = useAuthStore()
const run = useAsyncAction()
const { activos: personalActivos } = storeToRefs(personalStore)

const showInactivos = ref(false)
const lista = computed(() =>
  usuariosStore.items.filter((u) => (showInactivos.value ? true : u.activo)),
)

// Personas que aún no tienen usuario (para crear nuevos representantes).
function personasDisponibles(currentPersonalId = null) {
  return personalActivos.value.filter((p) => {
    const usado = usuariosStore.usadoPorPersona(p.id)
    return !usado || usado.personalId === currentPersonalId
  })
}

const modalOpen = ref(false)
const editId = ref(null)
const form = reactive({ email: '', password: '', rol: ROLES.REPRESENTANTE, personalId: '' })
const formError = ref('')

function openNew() {
  editId.value = null
  formError.value = ''
  Object.assign(form, { email: '', password: '', rol: ROLES.REPRESENTANTE, personalId: '' })
  modalOpen.value = true
}
function openEdit(u) {
  editId.value = u.id
  formError.value = ''
  Object.assign(form, { email: u.email || '', password: '', rol: u.rol, personalId: u.personalId || '' })
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  if (form.rol === ROLES.REPRESENTANTE && !form.personalId) {
    formError.value = 'Un representante debe estar enlazado a una persona.'
    return
  }
  try {
    if (editId.value) {
      await usuariosStore.update(editId.value, {
        rol: form.rol,
        personalId: form.rol === ROLES.ADMIN ? null : form.personalId,
      })
    } else {
      if (!form.email) {
        formError.value = 'El correo es obligatorio.'
        return
      }
      if (!form.password || form.password.length < 6) {
        formError.value = 'La contraseña debe tener al menos 6 caracteres.'
        return
      }
      await usuariosStore.create({
        email: form.email,
        password: form.password,
        rol: form.rol,
        personalId: form.rol === ROLES.ADMIN ? null : form.personalId,
      })
    }
    modalOpen.value = false
  } catch (e) {
    formError.value = friendlyError(e, 'No se pudo guardar el usuario.')
  }
}

function esYo(u) {
  return auth.currentUser?.id === u.id
}

async function toggle(u) {
  if (esYo(u)) return
  await run(() => (u.activo ? usuariosStore.softDelete(u.id) : usuariosStore.restore(u.id)))
}

function personaNombre(id) {
  return personalStore.byId(id)?.nombre || '—'
}
</script>

<template>
  <div>
    <PageHeader title="Usuarios" subtitle="Accesos y roles. Solo el administrador puede gestionarlos." :icon="UserCog">
      <template #actions>
        <label class="btn btn-ghost cursor-pointer">
          <input type="checkbox" v-model="showInactivos" class="accent-brand-500" /> Ver inactivos
        </label>
        <button class="btn btn-primary" @click="openNew"><Plus class="h-4 w-4" /> Nuevo usuario</button>
      </template>
    </PageHeader>

    <div class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/80">
          <tr>
            <th class="px-4 py-3">Usuario</th>
            <th class="px-4 py-3">Rol</th>
            <th class="px-4 py-3">Persona enlazada</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(u, i) in lista"
            :key="u.id"
            v-reveal="i"
            class="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
            :class="{ 'opacity-60': !u.activo }"
          >
            <td class="px-4 py-3 font-semibold">
              {{ u.email || u.username }}
              <span v-if="esYo(u)" class="badge ml-1 bg-brand-500/15 text-brand-600 dark:text-brand-400">tú</span>
            </td>
            <td class="px-4 py-3">
              <span class="badge" :class="u.rol === ROLES.ADMIN ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'">
                <ShieldCheck class="h-3 w-3" /> {{ ROLE_LABEL[u.rol] }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ u.personalId ? personaNombre(u.personalId) : '—' }}</td>
            <td class="px-4 py-3 text-center">
              <span class="badge" :class="u.activo ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-400/15 text-slate-500'">
                {{ u.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1.5">
                <button class="btn btn-ghost !px-2.5 !py-2" title="Editar" @click="openEdit(u)"><Pencil class="h-4 w-4" /></button>
                <button class="btn btn-ghost !px-2.5 !py-2" :disabled="esYo(u)" :title="u.activo ? 'Desactivar' : 'Activar'" @click="toggle(u)"><Power class="h-4 w-4" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!lista.length">
            <td colspan="5" class="px-4 py-10 text-center text-slate-400">No hay usuarios para mostrar.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-model="modalOpen" :title="editId ? 'Editar usuario' : 'Nuevo usuario'">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Correo</label>
          <div class="relative">
            <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input v-model="form.email" type="email" class="input pl-9" :disabled="!!editId" required placeholder="persona@empresa.com" autocomplete="off" />
          </div>
          <p v-if="editId" class="mt-1 text-xs text-slate-400">El correo no se puede cambiar desde aquí.</p>
        </div>

        <div>
          <label class="label">Rol</label>
          <select v-model="form.rol" class="input">
            <option :value="ROLES.ADMIN">{{ ROLE_LABEL[ROLES.ADMIN] }}</option>
            <option :value="ROLES.REPRESENTANTE">{{ ROLE_LABEL[ROLES.REPRESENTANTE] }}</option>
          </select>
        </div>

        <div v-if="form.rol === ROLES.REPRESENTANTE">
          <label class="label">Persona enlazada</label>
          <select v-model="form.personalId" class="input" required>
            <option value="" disabled>Selecciona la persona…</option>
            <option v-for="p in personasDisponibles(form.personalId)" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
          <p class="mt-1 text-xs text-slate-400">El representante solo verá los datos de esta persona.</p>
        </div>

        <div v-if="!editId">
          <label class="label">Contraseña</label>
          <div class="relative">
            <KeyRound class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input v-model="form.password" type="text" class="input pl-9" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
          </div>
          <p class="mt-1 text-xs text-slate-400">El usuario podrá cambiarla luego desde su sesión.</p>
        </div>

        <div v-if="formError" class="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          {{ formError }}
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ editId ? 'Guardar' : 'Crear usuario' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
