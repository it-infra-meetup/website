<template>
  <div class="lt-card">
    <div class="lt-thumbnail">
      <img
        v-if="image"
        :src="image"
        :alt="title"
      >
      <div v-else class="no-image">
        <Calendar class="w-8 h-8 opacity-30" />
      </div>
    </div>
    <div class="lt-content">
      <div class="lt-date">
        <Calendar class="w-3 h-3" />
        {{ date }}
      </div>
      <h3 class="lt-title">
        {{ title }}
      </h3>
      <p class="lt-speaker">
        Speaker: {{ author }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar } from '@lucide/vue'

defineProps<{
  date: string
  title: string
  author: string
  image?: string
}>()
</script>

<style scoped>
.lt-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 123, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.lt-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 123, 255, 0.15);
  border-color: var(--primary-color);
}

.lt-thumbnail {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #eef;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.lt-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lt-content {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.lt-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lt-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.lt-speaker {
  font-size: 0.85rem;
  color: #555;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0e7ef 0%, #f5f7fa 100%);
}
</style>
