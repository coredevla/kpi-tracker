<script setup>
import { onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import ToastHost from '@/components/ToastHost.vue'
import PlatformUpdateOverlay from '@/components/PlatformUpdateOverlay.vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const route = useRoute()
const blank = computed(() => route.meta?.layout === 'blank')
const appVersion = import.meta.env.VITE_APP_VERSION

onMounted(() => app.bootstrap())
</script>

<template>
  <PlatformUpdateOverlay />
  <ToastHost />

  <!-- Layout en blanco (login): sin navbar ni footer -->
  <RouterView v-if="blank" v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>

  <!-- Layout principal de la aplicación -->
  <div v-else class="relative min-h-screen">
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl dark:bg-brand-600/15" />
      <div class="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
      <div class="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl" />
    </div>

    <AppNavbar />

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <template v-if="app.ready">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </template>
      <div v-else class="flex h-[60vh] items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-500" />
      </div>
    </main>

    <footer class="mt-12 border-t border-slate-200/70 py-6 text-center text-sm text-slate-400 dark:border-slate-800/70">
      KPI Tracker · v{{ appVersion }}
      <span class="mx-2">·</span>
      Powered By Cherry Solutions
    </footer>
  </div>
</template>
