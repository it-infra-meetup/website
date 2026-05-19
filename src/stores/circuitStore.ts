import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface PathData {
  id: number
  d: string
  type: 'main' | 'sub-left' | 'sub-right'
}

export const useCircuitStore = defineStore('circuit', () => {
  // State
  const screenWidth = ref(0)
  const screenHeight = ref(0)
  const totalHeight = ref(0)
  const paths = ref<PathData[]>([])
  const isAnimating = ref(false)

  // Getters
  const mainPath = computed(() => paths.value.find(p => p.type === 'main'))
  const subPaths = computed(() => paths.value.filter(p => p.type !== 'main'))
  // viewBoxはSVG全体の高さを含む（元のHTMLと同じ）
  const viewBox = computed(() => `0 0 ${screenWidth.value} ${totalHeight.value}`)

  // Actions
  function updateDimensions(width: number, height: number): void {
    screenWidth.value = width
    screenHeight.value = height
    // 6セクション分の高さ = コンテナの高さ × 6（元のHTMLと同じ）
    totalHeight.value = height * 6
  }

  function generatePaths(): void {
    paths.value = []
    const laneWidth = screenWidth.value

    // メインパス
    const mainD = generate45DegPCBPath(
      laneWidth * 0.4,
      laneWidth * 0.6,
      laneWidth,
      totalHeight.value
    )
    paths.value.push({ id: Date.now(), d: mainD, type: 'main' })

    // サブパス（左側 × 2）
    for (let i = 0; i < 2; i++) {
      const d = generate45DegPCBPath(
        20,
        laneWidth * 0.3,
        laneWidth,
        totalHeight.value
      )
      paths.value.push({ id: Date.now() + i + 1, d, type: 'sub-left' })
    }

    // サブパス（右側 × 2）
    for (let i = 0; i < 2; i++) {
      const d = generate45DegPCBPath(
        laneWidth * 0.7,
        laneWidth - 20,
        laneWidth,
        totalHeight.value
      )
      paths.value.push({ id: Date.now() + i + 3, d, type: 'sub-right' })
    }
  }

  function generate45DegPCBPath(minX: number, maxX: number, width: number, height: number): string {
    let currentX = minX + (maxX - minX) / 2
    let currentY = 0
    let d = `M ${currentX} ${currentY}`

    const totalSections = 6
    const sectionH = height / totalSections
    const stepsPerSection = 4
    const stepY = sectionH / stepsPerSection

    for (let s = 0; s < totalSections; s++) {
      for (let i = 0; i < stepsPerSection; i++) {
        const nextY = currentY + stepY

        // ランダム横移動量決定
        const shift = (Math.random() - 0.5) * (width * 0.2)
        let targetX = currentX + shift
        targetX = Math.max(minX, Math.min(maxX, targetX))

        // 45度移動に必要な縦距離
        const deltaX = targetX - currentX
        const slopeHeight = Math.abs(deltaX)

        // 45度移動が可能かチェック
        if (slopeHeight > 1 && slopeHeight < stepY * 0.9) {
          const verticalSpace = (stepY - slopeHeight) / 2

          // a. 最初の垂直移動
          if (verticalSpace > 0) {
            d += ` L ${currentX} ${currentY + verticalSpace}`
          }

          // b. 45度移動
          d += ` L ${targetX} ${currentY + verticalSpace + slopeHeight}`

          // c. 残りの垂直移動
          d += ` L ${targetX} ${nextY}`

          currentX = targetX
        } else {
          // スペース不足：垂直のみ
          d += ` L ${currentX} ${nextY}`
        }

        currentY = nextY
      }
    }

    // 最後に画面外まで伸ばす
    d += ` L ${currentX} ${height + 200}`

    return d
  }

  function setAnimating(value: boolean): void {
    isAnimating.value = value
  }

  return {
    // State
    screenWidth,
    screenHeight,
    totalHeight,
    paths,
    isAnimating,
    // Getters
    mainPath,
    subPaths,
    viewBox,
    // Actions
    updateDimensions,
    generatePaths,
    generate45DegPCBPath,
    setAnimating
  }
})
