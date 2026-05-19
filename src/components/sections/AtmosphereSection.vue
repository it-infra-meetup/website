<template>
  <section id="atmosphere">
    <div class="content-wrapper">
      <div class="content-center w-full">
        <div class="mb-8">
          <h2 class="text-3xl font-bold main-text inline-block border-b-2 border-primary pb-2">集会の様子</h2>
          <p class="font-mono text-xs primary-text mt-1">Status: Active Gathering</p>
        </div>

        <div class="atmosphere-container">
          <div
              v-for="(item, index) in atmosphereItems"
              :key="index"
              class="atmosphere-card glass-panel hover:bg-white/80 transition-colors text-left"
          >
            <img class="mb-4" alt="" :src="item.img"/>
            <div class="flex gap-2">
            <component
                :is="getIcon(item.icon)"
                :class="item.iconColor"
                class="mb-2"
            />
            <h3 class="font-bold main-text mb-1">{{ item.title }}</h3>
            </div>
            <p class="text-xs muted-text">{{ item.description }}</p>
            <RouterLink
                v-if="item.link"
                :to="item.link"
                class="lt-link"
            >
              {{ item.linkText }}
              <ArrowRight class="w-4 h-4" />
            </RouterLink>
          </div>
        </div>
        <!-- スマホ用ドットインジケーター -->
        <div class="scroll-indicator">
          <button
              v-for="(item, index) in atmosphereItems"
              :key="index"
              class="indicator-dot"
              :class="{ active: currentIndex === index }"
              @click="scrollToCard(index)"
              :aria-label="`${item.title}へ移動`"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Users, Server, MonitorPlay, ArrowRight } from '@lucide/vue'

const currentIndex = ref(0)
const containerRef = ref<HTMLElement | null>(null)

const baseUrl = import.meta.env.BASE_URL

const atmosphereItems = [
  {
    icon: "users",
    title: "交流",
    description: "ワールドに配置されているタグを使って話したい同じ技術や気になる技術をさわっている人と話そう。最近の技術トレンドや障害対応大変だった！でもOK!",
    iconColor: "icon-primary",
    img: `${baseUrl}it-infra-lt.png`
  },
  {
    icon: "server",
    title: "機材",
    description: "QVペンを使って3D空間に配線をして議論したり、実際に機材を見せ合ったりして交流します。",
    iconColor: "icon-secondary",
    img: `${baseUrl}it-infra-writing.png`
  },
  {
    icon: "monitor-play",
    title: "LT",
    description: "スクリーンを使ったライトニングトークが開催されます。有志の登壇希望者がITインフラに関連するLTをします！",
    iconColor: "icon-primary",
    img: `${baseUrl}it-infra-lt-photo.png`,
    link: "/lt-list",
    linkText: "LT一覧を見る"
  }
]

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    users: Users,
    server: Server,
    'monitor-play': MonitorPlay
  }
  return icons[iconName]
}

// スクロール位置から現在のインデックスを計算
const handleScroll = () => {
  if (!containerRef.value) return
  const container = containerRef.value
  const scrollLeft = container.scrollLeft
  const cardWidth = container.scrollWidth / atmosphereItems.length
  currentIndex.value = Math.round(scrollLeft / cardWidth)
}

// 指定したカードへスクロール
const scrollToCard = (index: number) => {
  if (!containerRef.value) return
  const container = containerRef.value
  const cardWidth = container.scrollWidth / atmosphereItems.length
  container.scrollTo({
    left: cardWidth * index,
    behavior: 'smooth'
  })
}

onMounted(() => {
  containerRef.value = document.querySelector('.atmosphere-container')
  containerRef.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.main-text {
  color: var(--text-color);
}

.primary-text {
  color: var(--primary-color);
}

.muted-text {
  color: var(--text-muted);
}

.border-primary {
  border-color: var(--primary-color);
}

.icon-primary {
  color: var(--primary-color);
}

.icon-secondary {
  color: var(--secondary-color);
}

.lt-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-color);
  background: rgba(0, 123, 255, 0.1);
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.lt-link:hover {
  background: var(--primary-color);
  color: white;
}

/* デスクトップ表示（900px以上）: グリッドレイアウト */
.atmosphere-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
}

.atmosphere-card {
  min-width: 0;
}

.atmosphere-card img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
}

/* デスクトップではコンテナと画像をより大きく表示 */
@media (min-width: 900px) {
  #atmosphere .content-wrapper {
    max-width: 1600px;
  }

  .atmosphere-card img {
    max-height: 400px;
  }
}

.scroll-indicator {
  display: none;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--text-muted);
  opacity: 0.4;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
}

.indicator-dot:hover {
  opacity: 0.7;
}

.indicator-dot.active {
  background: var(--primary-color);
  opacity: 1;
  transform: scale(1.2);
}

/* スマホ表示（900px未満）: 横スクロール */
@media (max-width: 899px) {
  .atmosphere-container {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 1rem;
    padding-bottom: 0.5rem;
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .atmosphere-card {
    flex: 0 0 85%;
    min-width: 85%;
    scroll-snap-align: center;
  }

  .scroll-indicator {
    display: flex;
  }

  /* スクロールバーを非表示（見た目をすっきりさせる） */
  .atmosphere-container::-webkit-scrollbar {
    display: none;
  }

  .atmosphere-container {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
</style>
