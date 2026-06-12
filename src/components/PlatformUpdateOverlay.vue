<script setup>
import { RefreshCw, Wrench } from 'lucide-vue-next'
import { usePlatformUpdate } from '@/composables/usePlatformUpdate'

const {
  maintenance,
  maintenanceMessage,
  updateAvailable,
  embeddedVersion,
  remoteVersion,
  reloadApp,
} = usePlatformUpdate()
</script>

<template>
  <div
    v-if="maintenance"
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/90 px-6 text-center text-white backdrop-blur-sm"
    role="alertdialog"
    aria-live="assertive"
    aria-label="Plataforma en mantenimiento"
  >
    <Wrench class="mb-4 h-12 w-12 animate-pulse text-brand-400" />
    <p class="max-w-md text-lg font-medium">{{ maintenanceMessage }}</p>
    <div class="mt-6 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
  </div>

  <div
    v-else-if="updateAvailable"
    class="fixed bottom-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border border-brand-500/30 bg-white px-4 py-3 shadow-xl dark:bg-slate-900"
    role="status"
    aria-live="polite"
  >
    <RefreshCw class="h-5 w-5 shrink-0 text-brand-500" />
    <p class="flex-1 text-sm text-slate-700 dark:text-slate-200">
      Hay una nueva versión
      <span class="font-semibold">v{{ remoteVersion }}</span>
      (tienes v{{ embeddedVersion }}).
    </p>
    <button type="button" class="btn btn-primary shrink-0 text-sm" @click="reloadApp">
      Recargar
    </button>
  </div>
</template>
