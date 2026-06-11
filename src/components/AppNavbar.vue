<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { usePersonalStore } from '@/stores/personal'
import { ROLE_LABEL } from '@/data/roles'
import {
  LayoutDashboard, NotebookPen, BarChart3, Users, Boxes, Link2, UserCog,
  Moon, Sun, Menu, X, Activity, LogOut,
} from 'lucide-vue-next'

const app = useAppStore()
const auth = useAuthStore()
const personalStore = usePersonalStore()
const router = useRouter()
const open = ref(false)

const allLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bitacora', label: 'Bitácora', icon: NotebookPen },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/personal', label: 'Personal', icon: Users, adminOnly: true },
  { to: '/servicios', label: 'Servicios', icon: Boxes, adminOnly: true },
  { to: '/asignaciones', label: 'Asignaciones', icon: Link2, adminOnly: true },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, adminOnly: true },
]

const links = computed(() => allLinks.filter((l) => !l.adminOnly || auth.isAdmin))

const displayName = computed(() => {
  const u = auth.currentUser
  if (!u) return ''
  const persona = u.personalId ? personalStore.byId(u.personalId) : null
  return persona?.nombre || u.username
})
const rolLabel = computed(() => ROLE_LABEL[auth.rol] || '')

async function logout() {
  open.value = false
  await auth.logout()
  app.clearData()
  await router.replace({ name: 'login' })
}

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800/70">
    <div class="glass">
      <nav class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <RouterLink to="/" class="flex items-center gap-2.5">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow">
            <Activity class="h-5 w-5" />
          </span>
          <span class="text-lg font-extrabold tracking-tight">
            KPI<span class="text-gradient">Tracker</span>
          </span>
        </RouterLink>

        <div class="hidden items-center gap-1 lg:flex">
          <RouterLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-500/10 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
            active-class="!bg-brand-500/15 !text-brand-600 dark:!text-brand-400"
            exact-active-class="!bg-brand-500/15 !text-brand-600 dark:!text-brand-400"
          >
            <component :is="l.icon" class="h-4 w-4" />
            {{ l.label }}
          </RouterLink>
        </div>

        <div class="flex items-center gap-2">
          <!-- Usuario actual -->
          <div class="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white/60 py-1.5 pl-1.5 pr-3 dark:border-slate-700 dark:bg-slate-800/60 sm:flex">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white">
              {{ initials(displayName) }}
            </span>
            <div class="leading-tight">
              <p class="text-xs font-semibold">{{ displayName }}</p>
              <p class="text-[10px] uppercase tracking-wide text-slate-400">{{ rolLabel }}</p>
            </div>
          </div>

          <button class="btn btn-ghost !px-2.5 !py-2.5" @click="app.toggleTheme" aria-label="Cambiar tema">
            <Sun v-if="app.dark" class="h-4.5 w-4.5" />
            <Moon v-else class="h-4.5 w-4.5" />
          </button>
          <button class="btn btn-ghost !px-2.5 !py-2.5" @click="logout" title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut class="h-4.5 w-4.5" />
          </button>
          <button class="btn btn-ghost !px-2.5 !py-2.5 lg:hidden" @click="open = !open" aria-label="Menú">
            <Menu v-if="!open" class="h-5 w-5" />
            <X v-else class="h-5 w-5" />
          </button>
        </div>
      </nav>

      <Transition name="list">
        <div v-if="open" class="border-t border-slate-200/70 px-4 py-3 dark:border-slate-800/70 lg:hidden">
          <div class="mb-2 flex items-center gap-2.5 px-3 py-2 sm:hidden">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white">
              {{ initials(displayName) }}
            </span>
            <div class="leading-tight">
              <p class="text-sm font-semibold">{{ displayName }}</p>
              <p class="text-[10px] uppercase tracking-wide text-slate-400">{{ rolLabel }}</p>
            </div>
          </div>
          <RouterLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-brand-500/10 dark:text-slate-300"
            active-class="!text-brand-600 dark:!text-brand-400"
            @click="open = false"
          >
            <component :is="l.icon" class="h-4 w-4" />
            {{ l.label }}
          </RouterLink>
          <button
            class="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            @click="logout"
          >
            <LogOut class="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>
