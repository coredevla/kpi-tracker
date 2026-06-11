<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  sub: { type: String, default: '' },
  icon: { type: Object, default: null },
  accent: { type: String, default: 'from-brand-600 to-accent-500' },
})
</script>

<template>
  <div class="card-surface relative overflow-hidden p-5">
    <div
      class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-2xl"
      :class="accent"
    />
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ label }}</p>
      <div
        v-if="icon"
        class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white"
        :class="accent"
      >
        <component :is="icon" class="h-4.5 w-4.5" />
      </div>
    </div>
    <p class="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{{ value }}</p>
    <p v-if="sub" class="mt-1 text-xs text-slate-400">{{ sub }}</p>
  </div>
</template>
