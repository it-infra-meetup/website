<template>
  <div
    class="next-event-card glass-panel bracket w-full"
    data-testid="next-event-card"
  >
    <div class="font-mono text-xs primary-text mb-3 tracking-widest">
      NEXT_SESSION
    </div>

    <div v-if="loading" class="muted-text text-sm font-mono">
      LOADING…
    </div>

    <div v-else-if="error" class="muted-text text-sm font-mono">
      開催情報を取得できませんでした
    </div>

    <div v-else-if="!nextEvent" class="muted-text text-sm">
      直近の開催予定はありません
    </div>

    <template v-else>
      <p class="next-event-date main-text">
        <span class="primary-text">{{ formattedDate }}</span>
        <span class="next-event-weekday muted-text">({{ japaneseWeekday }})</span>
      </p>
      <p class="next-event-time main-text font-mono">
        {{ timeRange }}<span class="text-xs muted-text ml-2">JST</span>
      </p>
      <div class="next-event-where flex items-center gap-2 muted-text mt-3">
        <svg
          xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span class="text-xs">VRChat Group+ Instance</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEventsStore } from '@/stores/eventsStore'

const eventsStore = useEventsStore()

const loading = computed(() => eventsStore.loading)
const error = computed(() => eventsStore.error)
const nextEvent = computed(() => eventsStore.nextEvent)

const WEEKDAY_JP: Record<string, string> = {
  Sun: '日', Mon: '月', Tue: '火', Wed: '水', Thu: '木', Fri: '金', Sat: '土',
  SUN: '日', MON: '月', TUE: '火', WED: '水', THU: '木', FRI: '金', SAT: '土',
  Other: 'その他',
}

const formattedDate = computed(() => {
  const ev = nextEvent.value
  if (!ev) return ''
  const [, month, day] = ev.date.split('-')
  return `${parseInt(month, 10)}月${parseInt(day, 10)}日`
})

const japaneseWeekday = computed(() => {
  const ev = nextEvent.value
  if (!ev) return ''
  return WEEKDAY_JP[ev.weekday] ?? ev.weekday
})

const timeRange = computed(() => {
  const ev = nextEvent.value
  if (!ev) return ''
  const [hh, mm] = ev.start_time.split(':').map((x) => parseInt(x, 10))
  const startMin = hh * 60 + mm
  const endMin = startMin + ev.duration
  const endH = String(Math.floor(endMin / 60) % 24).padStart(2, '0')
  const endM = String(endMin % 60).padStart(2, '0')
  return `${ev.start_time} – ${endH}:${endM}`
})

onMounted(() => {
  void eventsStore.loadNext()
})
</script>

<style scoped>
.next-event-card {
  margin-top: 1rem;
  padding: 1.25rem 1.5rem;
  max-width: 28rem;
}

.next-event-date {
  font-size: 1.875rem; /* text-3xl */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.next-event-weekday {
  font-size: 1.25rem; /* text-xl */
  font-weight: 500;
  margin-left: 0.5rem;
}

.next-event-time {
  font-size: 1.125rem; /* text-lg */
  letter-spacing: 0.02em;
}

@media (min-width: 768px) {
  .next-event-date {
    font-size: 2.25rem; /* text-4xl */
  }
  .next-event-weekday {
    font-size: 1.5rem; /* text-2xl */
  }
}

.primary-text {
  color: var(--primary-color);
}

.main-text {
  color: var(--text-color);
}

.muted-text {
  color: var(--text-muted);
}
</style>
