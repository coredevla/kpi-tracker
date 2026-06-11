<script setup>
import { ref } from 'vue'

const props = defineProps({
  intensity: { type: Number, default: 8 },
})

const el = ref(null)
const style = ref({})

function onMove(e) {
  const node = el.value
  if (!node) return
  const rect = node.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width
  const py = (e.clientY - rect.top) / rect.height
  const ry = (px - 0.5) * props.intensity * 2
  const rx = -(py - 0.5) * props.intensity * 2
  style.value = {
    '--rx': `${rx}deg`,
    '--ry': `${ry}deg`,
    '--mx': `${px * 100}%`,
    '--my': `${py * 100}%`,
  }
}

function reset() {
  style.value = { '--rx': '0deg', '--ry': '0deg', '--mx': '50%', '--my': '50%' }
}
</script>

<template>
  <div
    ref="el"
    class="card-3d group relative"
    :style="style"
    @pointermove="onMove"
    @pointerleave="reset"
  >
    <div
      class="card-3d__glow pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    />
    <div class="card-3d__layer relative">
      <slot />
    </div>
  </div>
</template>
