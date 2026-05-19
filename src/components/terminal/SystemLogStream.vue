<template>
  <div class="console-bottom">
    <div class="absolute top-2 right-2 text-[9px] text-gray-600 font-mono">
      SYS_LOG: STREAMING
    </div>

    <div class="log-window" ref="logWindow">
      <div
        v-for="log in systemLogStore.logs"
        :key="log.id"
        :class="['sys-log-line', log.level]"
      >
        <span class="timestamp">{{ formatTimestamp(log.timestamp) }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>

    <div class="scanline"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSystemLogStore } from '@/stores/systemLogStore'

const systemLogStore = useSystemLogStore()
const logWindow = ref<HTMLDivElement>()
let timeoutId: number | null = null

const getRandomInterval = () => {
  return 200 + Math.random() * 7800 // 0.2秒〜8秒
}

const formatTimestamp = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

const scrollToBottom = () => {
  if (logWindow.value) {
    logWindow.value.scrollTop = logWindow.value.scrollHeight
  }
}

const scheduleNextLog = () => {
  timeoutId = window.setTimeout(() => {
    systemLogStore.addRandomLog()
    scheduleNextLog()
  }, getRandomInterval())
}

onMounted(() => {
  // 初期ログを数件追加
  systemLogStore.addRandomLog()
  systemLogStore.addRandomLog()
  systemLogStore.addRandomLog()

  // ランダムな間隔で新しいログを追加
  scheduleNextLog()
})

onUnmounted(() => {
  if (timeoutId !== null) {
    clearTimeout(timeoutId)
  }
})

// ログが追加されたら自動スクロール
watch(
  () => systemLogStore.logs.length,
  () => {
    scrollToBottom()
  }
)
</script>

<style scoped>
.console-bottom {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: rgba(240, 248, 255, 0.5);
  display: flex;
  flex-direction: column;
}

.log-window {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  line-height: 1.6;
  color: var(--text-muted);
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.log-window::-webkit-scrollbar {
  width: 8px;
}

.log-window::-webkit-scrollbar-track {
  background: transparent;
}

.log-window::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.sys-log-line {
  margin-bottom: 2px;
  display: flex;
  gap: 8px;
  word-wrap: break-word;
}

.timestamp {
  color: #999;
  flex-shrink: 0;
  font-size: 9px;
}

.log-message {
  flex: 1;
}

/* ログレベルのカラーコーディング */
.sys-log-line.info .log-message {
  color: var(--primary-color);
}

.sys-log-line.warn .log-message {
  color: #ff9800;
}

.sys-log-line.err .log-message {
  color: #f44336;
}

.sys-log-line.ok .log-message {
  color: #4caf50;
}

.sys-log-line.debug .log-message {
  color: #999;
}

.sys-log-line.default .log-message {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .log-window {
    font-size: 9px;
    padding: 0.75rem;
  }

  .timestamp {
    font-size: 8px;
  }
}
</style>
