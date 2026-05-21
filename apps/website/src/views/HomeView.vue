<template>
  <!-- Loading Screen -->
  <LoadingScreen />

  <!-- Navigation Overlay -->
  <NavigationOverlay />

  <!-- Background Layer (Split Screen) -->
  <SplitBackground />

  <!-- VRC TA Hub upcoming events badge -->
  <p
    v-if="eventsBadge"
    class="fixed bottom-4 right-4 z-40 text-xs font-mono text-slate-400 bg-black/40 px-3 py-1 rounded-full pointer-events-none"
    data-testid="events-badge"
  >
    {{ eventsBadge }}
  </p>

  <!-- Main Content -->
  <main>
    <HeroSection />
    <AboutSection />
    <AtmosphereSection />
    <EventsSection />
    <TopicsSection />
    <JoinSection />
  </main>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import LoadingScreen from '@/components/ui/LoadingScreen.vue'
import NavigationOverlay from '@/components/layout/NavigationOverlay.vue'
import SplitBackground from '@/components/layout/SplitBackground.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import AtmosphereSection from '@/components/sections/AtmosphereSection.vue'
import EventsSection from '@/components/sections/EventsSection.vue'
import TopicsSection from '@/components/sections/TopicsSection.vue'
import JoinSection from '@/components/sections/JoinSection.vue'
import { useEventsStore } from '@/stores/eventsStore'

const eventsStore = useEventsStore()

onMounted(() => {
  void eventsStore.loadUpcoming()
})

const eventsBadge = computed(() => {
  if (eventsStore.loading) return '読み込み中…'
  if (eventsStore.error) return '今月の予定: 取得失敗'
  if (eventsStore.count === null) return ''
  return `今月の予定: ${eventsStore.count} 件`
})
</script>
