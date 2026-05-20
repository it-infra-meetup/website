<template>
  <nav class="nav-overlay">
    <div class="nav-text">
      <span class="cursor">_</span>
    </div>
    <div class="text-right nav-text">
      <div>UPLINK: ESTABLISHED</div>
      <div>{{ uiStore.latencyDisplay }}</div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()

let intervalId: number | null = null

onMounted(() => {
  // 1.5秒ごとにレイテンシ更新
  intervalId = window.setInterval(() => {
    uiStore.updateLatency()
  }, 1500)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.nav-overlay {
  position: fixed;
  top: 0;
  width: 100%;
  padding: 1rem;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  pointer-events: none;
}

.nav-text {
  color: var(--primary-color);
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
