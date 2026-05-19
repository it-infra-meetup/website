<template>
  <div class="console-side">
    <InteractiveTerminal />
    <SystemLogStream />
  </div>
</template>

<script setup lang="ts">
import InteractiveTerminal from '../terminal/InteractiveTerminal.vue'
import SystemLogStream from '../terminal/SystemLogStream.vue'
</script>

<style scoped>
.console-side {
  width: 50%;
  height: 100%;
  background-color: var(--console-bg);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.console-top,
.console-bottom {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.console-top {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.5);
}

.console-bottom {
  background-color: rgba(240, 248, 255, 0.5);
}

.terminal-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

@media (max-width: 768px) {
  .console-side {
    width: 100%;
    height: 50%;
  }
}
</style>
