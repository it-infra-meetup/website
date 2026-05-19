<template>
  <section id="events">
    <div class="content-wrapper">
      <div class="content-left">
        <div class="glass-panel bracket w-full">
          <div class="flex items-center gap-4 mb-6">
            <span class="font-mono text-4xl primary-text opacity-50">03</span>
            <h2 class="text-3xl font-bold main-text">Recent Events</h2>
          </div>
          <ul class="space-y-4 font-mono text-sm">
            <li
              v-for="(event, index) in events"
              :key="index"
              class="pl-4 py-1"
              :class="event.borderColor"
            >
              <div class="muted-text text-xs">{{ event.date }}</div>
              <div class="main-text font-bold">{{ event.title }}</div>
              <div class="muted-text text-xs mt-1">{{ event.description }}</div>
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
interface EventItem {
  date: string
  title: string
  description: string
  borderColor: string
}

const events: EventItem[] = [
  {
    date: "2025.11.22",
    title: "第64回ITインフラ集会.log",
    description: "雑談会",
    borderColor: "border-primary"
  },
  {
    date: "2025.11.08",
    title: "自立機械知能PAMIQの計算機環境",
    description: "speaker.GesonAnko",
    borderColor: "border-secondary"
  },
  {
    date: "2025.10.11",
    title: "NixOS + Kubernetesで構築する自宅サーバーのすべて",
    description: "speaker.ichi-h",
    borderColor: "border-primary"
  }
]
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
</style>
