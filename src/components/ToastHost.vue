<script setup>
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-vue-next'

const toast = useToastStore()
const { items } = storeToRefs(toast)

const STYLES = {
  success: { icon: CheckCircle2, cls: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300' },
  error: { icon: AlertTriangle, cls: 'border-rose-500/40 text-rose-700 dark:text-rose-300' },
  info: { icon: Info, cls: 'border-brand-500/40 text-brand-700 dark:text-brand-300' },
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      <TransitionGroup name="list">
        <div
          v-for="t in items"
          :key="t.id"
          class="card-surface glass pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-4 p-3.5 shadow-2xl"
          :class="(STYLES[t.type] || STYLES.info).cls"
          role="alert"
        >
          <component :is="(STYLES[t.type] || STYLES.info).icon" class="mt-0.5 h-5 w-5 shrink-0" />
          <p class="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{{ t.message }}</p>
          <button
            class="shrink-0 rounded-lg p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Cerrar"
            @click="toast.dismiss(t.id)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
