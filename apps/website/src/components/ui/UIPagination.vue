<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      class="pagination-btn"
      :disabled="currentPage === 1"
      @click="emit('prev')"
    >
      <ChevronLeft class="w-4 h-4" />
      PREV
    </button>

    <div class="pagination-pages">
      <button
        v-for="page in totalPages"
        :key="page"
        class="pagination-page"
        :class="{ active: page === currentPage }"
        @click="emit('goToPage', page)"
      >
        {{ page }}
      </button>
    </div>

    <button
      class="pagination-btn"
      :disabled="currentPage === totalPages"
      @click="emit('next')"
    >
      NEXT
      <ChevronRight class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'

defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  prev: []
  next: []
  goToPage: [page: number]
}>()
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  flex-wrap: wrap;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 0.5rem;
}

.pagination-page {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-page:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.pagination-page.active {
  background: #e91e63;
  color: white;
  border-color: #e91e63;
}

@media (max-width: 900px) {
  .pagination {
    gap: 0.5rem;
  }
  .pagination-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
  .pagination-page {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
}
</style>
