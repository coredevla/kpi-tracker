<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale,
} from 'chart.js'
import { useAppStore } from '@/stores/app'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  labels: { type: Array, required: true },
  datasets: { type: Array, required: true },
  horizontal: { type: Boolean, default: false },
})

const app = useAppStore()

const data = computed(() => ({ labels: props.labels, datasets: props.datasets }))

const options = computed(() => {
  const grid = app.dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.12)'
  const ticks = app.dark ? '#94a3b8' : '#475569'
  return {
    indexAxis: props.horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: ticks, font: { family: 'Outfit' } } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { color: grid }, ticks: { color: ticks, font: { family: 'Outfit' } } },
      y: { grid: { color: grid }, ticks: { color: ticks, font: { family: 'Outfit' } }, beginAtZero: true },
    },
  }
})
</script>

<template>
  <div class="h-72">
    <Bar :data="data" :options="options" />
  </div>
</template>
