<template>
  <div ref="containerRef" class="circuit-side">
    <CircuitSvg />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useCircuitStore } from '@/stores/circuitStore'
import CircuitSvg from '../circuit/CircuitSvg.vue'

const circuitStore = useCircuitStore()
const containerRef = ref<HTMLDivElement>()

const handleResize = () => {
  const rect = containerRef.value?.getBoundingClientRect()
  if (rect) {
    circuitStore.updateDimensions(rect.width, rect.height)
  }
}

// デバウンス処理
let resizeTimer: number | null = null
const debouncedResize = () => {
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer)
  }
  resizeTimer = window.setTimeout(handleResize, 200)
}

onMounted(() => {
  // DOMが完全にレンダリングされてからdimensionsを取得
  nextTick(() => {
    handleResize()
  })
  window.addEventListener('resize', debouncedResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer)
  }
})
</script>

<style scoped>
.circuit-side {
  width: 50%;
  height: 100%;
  background-color: var(--circuit-bg);
  overflow: hidden;
  position: relative;
}

.circuit-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

@media (max-width: 899px) {
  .circuit-side {
    width: 100%;
    height: 100%;
  }
}
</style>
