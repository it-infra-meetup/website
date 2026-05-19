<template>
  <div class="console-top" @click="focusInput">
    <div class="absolute top-2 right-2 text-[9px] text-gray-600 font-mono">
      USER_TERM: ACTIVE
    </div>

    <div class="terminal-window" ref="termWindow">
      <!-- ウェルカムメッセージ -->
      <div class="log-line text-gray-500 mb-4">
        Welcome to IT-Infra Gathering Terminal v1.0<br>
        Type 'ls' to see files, 'cat &lt;file&gt;' to read.
      </div>

      <!-- 出力行 -->
      <div class="log-output">
        <div
            v-for="line in terminalStore.outputLines"
            :key="line.id"
            :class="['log-line', line.className]"
            v-html="line.text"
        />
      </div>

      <!-- 入力行 -->
      <div class="input-line">
        <span class="prompt">guest@infra:~$</span>
        <input
            ref="inputEl"
            type="text"
            id="console-input"
            v-model="currentInput"
            @keydown.enter="handleCommand"
            autocomplete="off"
            spellcheck="false"
            aria-label="Terminal command input"
            role="textbox"
        />
      </div>
    </div>

    <div class="scanline"></div>
  </div>
</template>

<script setup lang="ts">
import {ref, nextTick, onMounted} from 'vue'
import {useTerminalStore} from '@/stores/terminalStore'

const terminalStore = useTerminalStore()
const inputEl = ref<HTMLInputElement>()
const termWindow = ref<HTMLDivElement>()
const currentInput = ref('')

const handleCommand = () => {
  const cmd = currentInput.value.trim()
  if (cmd) {
    terminalStore.addOutput(`<span class="prompt">guest@infra:~$</span> ${cmd}`, '')
    terminalStore.executeCommand(cmd)
  }
  currentInput.value = ''
  nextTick(() => scrollToBottom())
}

const scrollToBottom = () => {
  if (termWindow.value) {
    termWindow.value.scrollTop = termWindow.value.scrollHeight
  }
}

const focusInput = () => {
  inputEl.value?.focus()
}

onMounted(() => {
  nextTick(() => {
    focusInput()
  })
})
</script>

<style scoped>
.console-top {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: var(--console-bg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.terminal-window {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-color);
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.terminal-window::-webkit-scrollbar {
  width: 8px;
}

.terminal-window::-webkit-scrollbar-track {
  background: transparent;
}

.terminal-window::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.log-line {
  margin-bottom: 4px;
  word-wrap: break-word;
}

.log-line :deep(.prompt) {
  color: var(--primary-color);
  margin-right: 8px;
  white-space: nowrap;
}

.log-line:deep(.text-blue-400) {
  color: var(--primary-color);
}

.log-line:deep(.text-yellow-400) {
  color: #ff9800;
}

.log-output {
  margin-bottom: 8px;
}

.input-line {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.prompt {
  color: var(--primary-color);
  margin-right: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

#console-input {
  background: transparent;
  border: none;
  color: var(--primary-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  width: 100%;
  outline: none;
  caret-color: var(--primary-color);
}

/* ログレベルカラー */
.log-line:deep(.log-warn),
:deep(.log-warn) {
  color: #ff9800;
}

.log-line:deep(.log-err),
:deep(.log-err) {
  color: #f44336;
}

.log-line:deep(.log-info),
:deep(.log-info) {
  color: var(--primary-color);
}

.log-line:deep(.log-cmd),
:deep(.log-cmd) {
  color: var(--text-muted);
}

.log-line:deep(.log-success),
:deep(.log-success) {
  color: #4caf50;
}

/* ls コマンド出力 */
.log-line.log-ls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.log-line:deep(.file-entry) {
  color: var(--primary-color);
  white-space: nowrap;
}

/* cat コマンド出力（ASCII アート対応） */
.log-line:deep(.log-pre) {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: inherit;
  white-space: pre;
  color: inherit;
  background: transparent;
}

/* ターミナル内リンク */
.log-line:deep(.terminal-link) {
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: color 0.2s;
}

.log-line:deep(.terminal-link:hover) {
  color: var(--text-color);
}

@media (max-width: 768px) {
  .terminal-window {
    font-size: 10px;
    padding: 0.75rem;
  }
}
</style>
