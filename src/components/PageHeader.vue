<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: Object, default: null },
})
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="flex items-center gap-3">
      <span
        v-if="icon"
        class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow"
      >
        <component :is="icon" class="h-6 w-6" />
      </span>
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
