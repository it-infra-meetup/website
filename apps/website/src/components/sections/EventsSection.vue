<template>
  <section id="events">
    <div class="content-wrapper">
      <div class="content-left">
        <div class="glass-panel bracket w-full">
          <div class="flex items-center gap-4 mb-6">
            <span class="font-mono text-4xl primary-text opacity-50">03</span>
            <h2 class="text-3xl font-bold main-text">
              Recent Events
            </h2>
          </div>

          <div v-if="loading" class="muted-text font-mono text-sm">
            LOADING…
          </div>
          <div v-else-if="error" class="muted-text font-mono text-sm">
            開催情報を取得できませんでした
          </div>
          <div v-else-if="events.length === 0" class="muted-text font-mono text-sm">
            直近の開催はありません
          </div>
          <ul v-else class="space-y-4 font-mono text-sm">
            <li
              v-for="(event, index) in events"
              :key="event.id"
              :class="index % 2 === 0 ? 'border-primary' : 'border-secondary'"
            >
              <a
                :href="event.url"
                target="_blank"
                rel="noopener noreferrer"
                class="event-link block pl-4 py-1"
              >
                <div class="muted-text text-xs">
                  {{ event.date }}
                </div>
                <div class="event-title main-text font-bold flex items-center gap-1.5">
                  <span>{{ event.title }}</span>
                  <ExternalLink class="external-icon w-3 h-3 shrink-0" />
                </div>
                <div class="muted-text text-xs mt-1">
                  {{ event.description }}
                </div>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="content-right">
        <!-- Circuit animation focus -->
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ExternalLink } from '@lucide/vue'
import { useEventsStore } from '@/stores/eventsStore'

/** Canonical event-detail page on the VRC TA Hub. */
const VRC_TA_HUB_EVENT_DETAIL_BASE = 'https://vrc-ta-hub.com/event/detail'

const eventsStore = useEventsStore()

const loading = computed(() => eventsStore.recentLtsLoading)
const error = computed(() => eventsStore.recentLtsError)

const events = computed(() =>
  eventsStore.recentLts.map((detail) => ({
    id: detail.id,
    url: `${VRC_TA_HUB_EVENT_DETAIL_BASE}/${detail.id}/`,
    date: detail.event.date.replace(/-/g, '.'),
    title: detail.theme,
    description: detail.speaker ? `speaker.${detail.speaker}` : '',
  })),
)

onMounted(() => {
  void eventsStore.loadRecentLts()
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
  border-left: 2px solid var(--primary-color);
}

.border-secondary {
  border-left: 2px solid var(--secondary-color);
}

.event-link {
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.event-link:hover {
  background-color: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.event-title {
  transition: color 0.2s ease;
}

.event-link:hover .event-title {
  color: var(--primary-color);
}

.external-icon {
  color: var(--primary-color);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.event-link:hover .external-icon,
.event-link:focus-visible .external-icon {
  opacity: 0.8;
}

.event-link:focus-visible {
  outline: 1px solid var(--primary-color);
  outline-offset: 2px;
}
</style>
