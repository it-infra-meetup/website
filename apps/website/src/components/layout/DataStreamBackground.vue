<template>
  <div class="bg-container">
    <div ref="containerRef" class="data-stream-bg">
      <svg id="stream-svg" ref="svgRef" preserveAspectRatio="xMidYMin slice">
        <defs>
          <filter id="packet-glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g id="stream-group" ref="groupRef" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import gsap from 'gsap'

const containerRef = ref<HTMLDivElement>()
const svgRef = ref<SVGSVGElement>()
const groupRef = ref<SVGGElement>()

let screenWidth = 0
let screenHeight = 0
let resizeTimer: number | null = null

const generateSimplePath = (x: number, height: number) => {
  return `M ${x} 0 L ${x} ${height}`
}

const updatePaths = () => {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect || !svgRef.value || !groupRef.value) return

  screenWidth = rect.width
  screenHeight = rect.height

  svgRef.value.setAttribute("viewBox", `0 0 ${screenWidth} ${screenHeight}`)

  // Clear existing elements
  while (groupRef.value.firstChild) {
    groupRef.value.removeChild(groupRef.value.firstChild)
  }

  const laneWidth = screenWidth
  const count = Math.floor(laneWidth / 60)
  const spacing = laneWidth / count

  for (let i = 1; i < count; i++) {
    const x = i * spacing

    // Path
    const pathD = generateSimplePath(x, screenHeight + 200)
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
    p.setAttribute("d", pathD)
    p.setAttribute("class", "stream-path")
    p.style.opacity = String(Math.random() * 0.3 + 0.1)
    groupRef.value.appendChild(p)

    // Packet (create fewer packets than lines)
    if (Math.random() > 0.6) {
      const pkt = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      pkt.setAttribute("width", "4")
      pkt.setAttribute("height", "20")
      pkt.setAttribute("x", String(x - 2))
      pkt.setAttribute("y", "-20")
      pkt.setAttribute("fill", "#00bcd4")
      pkt.setAttribute("class", "packet-glow")
      groupRef.value.appendChild(pkt)

      gsap.to(pkt, {
        y: screenHeight + 50,
        duration: 3 + Math.random() * 7,
        repeat: -1,
        ease: "none",
        delay: Math.random() * 5
      })
    }
  }
}

// 幅が変わった時だけ再生成する。モバイルのアドレスバー伸縮による高さのみの
// 変化で全パケットを作り直すとスクロール中に背景がガタつくため無視する。
let lastWidth = window.innerWidth
const handleResize = () => {
  if (window.innerWidth === lastWidth) return
  lastWidth = window.innerWidth
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer)
  }
  resizeTimer = window.setTimeout(updatePaths, 200)
}

onMounted(async () => {
  await nextTick()
  updatePaths()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer)
  }
})
</script>

<style scoped>
.bg-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}

.data-stream-bg {
  width: 100%;
  height: 100%;
  background-color: transparent;
  position: relative;
  overflow: hidden;
}

#stream-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

:deep(.stream-path) {
  fill: none;
  stroke: #cfd8dc;
  stroke-width: 1;
  opacity: 0.6;
}

:deep(.packet-glow) {
  filter: drop-shadow(0 0 5px var(--secondary-color));
}
</style>
