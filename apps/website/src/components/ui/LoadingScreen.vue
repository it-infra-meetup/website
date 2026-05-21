<template>
  <div v-if="uiStore.isLoading" class="loader">
    <div class="loader-content">
      <div class="font-mono loader-text text-base md:text-lg mb-4 tracking-wider">
        SYSTEM BOOT SEQUENCE...
      </div>
      <div class="progress-container">
        <div ref="loaderBar" class="progress-bar" />
      </div>
      <div ref="percentText" class="font-mono loader-percent text-xs mt-3">
        0%
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import gsap from 'gsap'

const uiStore = useUiStore()
const loaderBar = ref<HTMLDivElement>()
const percentText = ref<HTMLDivElement>()

onMounted(() => {
  const tl = gsap.timeline({
    delay: 0.3,
    onComplete: () => {
      setTimeout(() => {
        uiStore.setLoading(false)
      }, 300)
    }
  })

  if (loaderBar.value && percentText.value) {
    // プログレスバーとパーセンテージを同時にアニメーション
    tl.to(loaderBar.value, {
      width: "100%",
      duration: 2,
      ease: "power2.inOut"
    })
    .to(percentText.value, {
      innerText: "100%",
      duration: 2,
      snap: { innerText: 1 },
      ease: "power2.inOut",
      onUpdate: function() {
        if (percentText.value) {
          const value = Math.round(parseFloat(percentText.value.innerText))
          percentText.value.innerText = value + "%"
        }
      }
    }, "<")
    .to(".loader", {
      y: "-100%",
      duration: 0.8,
      ease: "power2.inOut"
    }, "+=0.3")
  }
})
</script>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  pointer-events: auto;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.loader-text {
  color: var(--primary-color);
}

.loader-percent {
  color: var(--primary-color);
}

.progress-container {
  width: 320px;
  max-width: 90vw;
  height: 4px;
  background: #e0e0e0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background: var(--primary-color);
  border-radius: 9999px;
}

@media (max-width: 768px) {
  .progress-container {
    width: 280px;
  }
}
</style>
