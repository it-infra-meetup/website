<template>
  <svg
    id="circuit-svg"
    ref="svgRef"
    preserveAspectRatio="xMidYMin slice"
  >
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g id="circuit-group" ref="groupRef">
      <!-- パスとパケットをここに動的生成 -->
    </g>
  </svg>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useCircuitStore } from '@/stores/circuitStore'
import { useScrollAnimations } from '@/composables/useScrollAnimations'
import { ScrollTrigger } from 'gsap/all'

const circuitStore = useCircuitStore()
const svgRef = ref<SVGSVGElement>()
const groupRef = ref<SVGGElement>()

const updatePaths = () => {
  // dimensionsが設定されていない場合はスキップ
  if (circuitStore.screenWidth === 0 || circuitStore.screenHeight === 0) {
    return
  }

  // viewBox設定
  if (svgRef.value) {
    svgRef.value.setAttribute("viewBox", circuitStore.viewBox)
  }

  // パス生成
  circuitStore.generatePaths()

  // DOM生成
  const group = groupRef.value
  if (!group) return

  // 既存要素クリア
  while (group.firstChild) {
    group.removeChild(group.firstChild)
  }

  // パス描画
  circuitStore.paths.forEach(pathData => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", pathData.d)

    if (pathData.type === 'main') {
      // 背景パス（グレー）
      const bgPath = path.cloneNode() as SVGPathElement
      bgPath.setAttribute("d", pathData.d)
      bgPath.setAttribute("class", "circuit-path-bg")
      group.appendChild(bgPath)

      // アクティブパス（ネオンブルー、描画アニメーション用）
      path.setAttribute("class", "circuit-path-active")
      path.id = "active-path"
      group.appendChild(path)

      // strokeDasharray 初期化（DrawSVG風）
      const len = path.getTotalLength()
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = `${len}`
    } else {
      // サブパス
      path.setAttribute("class", "circuit-path-sub")
      group.appendChild(path)
    }
  })

  // パケット生成・アニメーション
  nextTick(() => {
    initScrollAnimations()
  })
}

const initScrollAnimations = () => {
  const activePath = document.getElementById("active-path")
  if (!activePath || !groupRef.value) return
  if (!(activePath instanceof SVGPathElement)) return

  useScrollAnimations(activePath, groupRef.value, circuitStore.totalHeight)

  // ScrollTriggerを確実に初期化・更新
  nextTick(() => {
    ScrollTrigger.refresh()
  })
}

// dimensionsが更新されたらパスを再生成
watch(
  () => circuitStore.screenWidth,
  () => {
    if (circuitStore.screenWidth > 0 && circuitStore.screenHeight > 0) {
      // 既存アニメーション削除
      ScrollTrigger.getAll().forEach(t => t.kill())
      // パス再生成
      updatePaths()
      // ScrollTriggerを更新
      nextTick(() => {
        ScrollTrigger.refresh()
      })
    }
  }
)

// デバウンス処理
let resizeTimer: number | null = null
const handleResize = () => {
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer)
  }
  resizeTimer = window.setTimeout(() => {
    // 既存アニメーション削除
    ScrollTrigger.getAll().forEach(t => t.kill())

    // パス再生成
    updatePaths()
  }, 200)
}

onMounted(() => {
  // 初回マウント時にdimensionsがあれば生成
  if (circuitStore.screenWidth > 0 && circuitStore.screenHeight > 0) {
    updatePaths()
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ScrollTrigger.getAll().forEach(t => t.kill())
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer)
  }
})
</script>

<style scoped>
#circuit-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  will-change: transform;
}

#circuit-group {
  /* transform: translateZ(0); */
}

:deep(.circuit-path-bg) {
  fill: none;
  stroke: #b0bec5; /* 薄いグレー */
  stroke-width: 2;
}

:deep(.circuit-path-active) {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 2;
  stroke-linecap: round;
  filter: drop-shadow(0 0 5px rgba(0, 123, 255, 0.5));
  will-change: stroke-dashoffset, transform;
}

:deep(.circuit-path-sub) {
  fill: none;
  stroke: #cfd8dc; /* さらに薄いグレー */
  stroke-width: 1;
  opacity: 0.6;
}

:deep(.packet-glow-main) {
  filter: drop-shadow(0 0 8px var(--primary-color));
  will-change: transform;
}

:deep(.packet-glow-sub) {
  filter: drop-shadow(0 0 5px var(--secondary-color));
}
</style>
