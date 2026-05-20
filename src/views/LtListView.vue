<template>
  <DataStreamBackground />

  <!-- Navigation -->
  <nav class="nav-bar">
    <RouterLink to="/" class="nav-link">
      <ArrowLeft class="w-4 h-4" />
      BACK TO TOP
    </RouterLink>
    <div class="font-mono text-xs text-primary">
      ARCHIVE_MODE: ONLINE
    </div>
  </nav>

  <!-- Main Content -->
  <main class="lt-main">
    <div class="container">
      <!-- Header -->
      <div class="archive-header">
        <div class="glass-panel-header">
          <h1 class="text-3xl md:text-5xl font-bold text-gray-800 mb-2 text-neon tracking-tighter">
            LT Archives
          </h1>
          <p class="text-gray-500 font-mono text-sm">
            過去開催されたLT一覧です
          </p>
          <a href="https://forms.gle/TrvBXq5chjtLiD7s5" class="apply-btn">
            <ExternalLink class="w-4 h-4" />
            LTを申込む！
          </a>
        </div>
      </div>

      <!-- LT Grid -->
      <div class="archive-grid">
        <LtCard
          v-for="lt in paginatedItems"
          :key="lt.id"
          :date="lt.date"
          :title="lt.title"
          :author="lt.author"
          :image="lt.image"
        />
      </div>

      <!-- Pagination -->
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @prev="prevPage"
        @next="nextPage"
        @go-to-page="goToPage"
      />

      <div class="mt-8 text-center">
        <p class="text-gray-500 text-sm font-mono">
          Page {{ currentPage }} / {{ totalPages }} - {{ allLtItems.length }} Archives
        </p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import {RouterLink} from 'vue-router'
import {ArrowLeft, ExternalLink} from '@lucide/vue'
import {lts} from '@/consts'
import DataStreamBackground from '@/components/layout/DataStreamBackground.vue'
import LtCard from '@/components/lt/LtCard.vue'
import Pagination from '@/components/ui/Pagination.vue'

// ページネーション設定
const ITEMS_PER_PAGE = 18
const currentPage = ref(1)

// 日付キーをフォーマットする関数
const formatDate = (key: string): string => {
  const dateStr = key.replace(/_.*$/, '')
  if (dateStr.length !== 8) return key
  const year = dateStr.slice(0, 4)
  const month = dateStr.slice(4, 6)
  const day = dateStr.slice(6, 8)
  return `${year}.${month}.${day}`
}

// LTデータを配列に変換（新しい順）
const allLtItems = computed(() => {
  return Object.entries(lts)
      .map(([key, item]) => ({
        id: key,
        date: formatDate(key),
        title: item.title,
        author: item.author,
        image: item.image,
      }))
      .sort((a, b) => b.id.localeCompare(a.id))
})

// ページネーション
const totalPages = computed(() => Math.ceil(allLtItems.value.length / ITEMS_PER_PAGE))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return allLtItems.value.slice(start, end)
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({top: 0, behavior: 'smooth'})
  }
}

const prevPage = () => goToPage(currentPage.value - 1)
const nextPage = () => goToPage(currentPage.value + 1)
</script>

<style scoped>
/* Navigation */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem 2rem;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: auto;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), transparent);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--primary-color);
}

.text-primary {
  color: #ff9900;
}

/* Main Content */
.lt-main {
  position: relative;
  z-index: 10;
  padding-top: 80px;
  padding-bottom: 40px;
  min-height: 100vh;
  pointer-events: none;
}

.container {
  pointer-events: auto;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.archive-header {
  margin-bottom: 3rem;
  text-align: center;
}

.glass-panel-header {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  padding: 2rem 4rem;
  border-radius: 8px;
  display: inline-block;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
  font-family: 'Noto Sans JP', sans-serif;
}

.apply-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
  background: var(--primary-color);
  border: none;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.apply-btn:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

/* Responsive */
@media (max-width: 900px) {
  .archive-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 1.5rem;
  }
}
</style>
