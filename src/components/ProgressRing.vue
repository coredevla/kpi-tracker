<script setup>
import { computed } from 'vue'
import { clampPct } from '@/utils/format'

const props = defineProps({
  value: { type: Number, default: 0 },
  size: { type: Number, default: 96 },
  stroke: { type: Number, default: 9 },
  color: { type: String, default: '#3b90f6' },
})

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - clampPct(props.value) / 100))
</script>

<template>
  <div class="relative inline-flex items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
        class="stroke-slate-200 dark:stroke-slate-700"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        style="transition: stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <slot>
        <span class="text-lg font-bold">{{ Math.round(value) }}%</span>
      </slot>
    </div>
  </div>
</template>
