<template>
  <div class="split-bg">
    <ConsoleSide class="console-side"/>
    <CircuitSide/>
  </div>
</template>

<script setup lang="ts">
import ConsoleSide from './ConsoleSide.vue'
import CircuitSide from './CircuitSide.vue'
</script>

<style scoped>
.split-bg {
  position: fixed;
  inset: 0;
  display: flex;
  z-index: 0;
}

@media (max-width: 899px) {
  .console-side {
    display: none;
  }
}
</style>
