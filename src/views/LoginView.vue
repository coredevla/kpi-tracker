<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { Activity, LogIn, Eye, EyeOff, ShieldAlert } from 'lucide-vue-next'

const auth = useAuthStore()
const app = useAppStore()
const router = useRouter()
const route = useRoute()
const appVersion = import.meta.env.VITE_APP_VERSION

const email = ref('')
const password = ref('')
const showPass = ref(false)
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    // La RLS solo deja leer datos autenticado: cárgalos ahora con el alcance del rol.
    await app.loadData()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (e) {
    error.value = e.message || 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
      <div class="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
    </div>

    <div class="card-surface glass w-full max-w-md p-8 shadow-2xl animate-fade-up">
      <div class="mb-7 flex flex-col items-center text-center">
        <span class="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow">
          <Activity class="h-7 w-7" />
        </span>
        <h1 class="text-2xl font-extrabold tracking-tight">
          KPI<span class="text-gradient">Tracker</span>
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="label">Correo</label>
          <input v-model="email" type="email" class="input" autocomplete="username" required autofocus placeholder="tucorreo@empresa.com" />
        </div>
        <div>
          <label class="label">Contraseña</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              class="input pr-11"
              autocomplete="current-password"
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-brand-500"
              @click="showPass = !showPass"
              :aria-label="showPass ? 'Ocultar' : 'Mostrar'"
            >
              <EyeOff v-if="showPass" class="h-4.5 w-4.5" />
              <Eye v-else class="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <Transition name="list">
          <div v-if="error" class="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400">
            <ShieldAlert class="h-4 w-4 shrink-0" /> {{ error }}
          </div>
        </Transition>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <template v-else><LogIn class="h-4 w-4" /> Entrar</template>
        </button>
      </form>
    </div>

    <p class="absolute bottom-6 text-center text-xs text-slate-400">
      v{{ appVersion }} · Powered By Cherry Solutions
    </p>
  </div>
</template>
