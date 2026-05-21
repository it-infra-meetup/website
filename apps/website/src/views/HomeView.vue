<template>
  <!-- Loading Screen -->
  <LoadingScreen />

  <!-- Navigation Overlay -->
  <NavigationOverlay />

  <!-- Background Layer (Split Screen) -->
  <SplitBackground />

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
import LoadingScreen from '@/components/ui/LoadingScreen.vue'
import NavigationOverlay from '@/components/layout/NavigationOverlay.vue'
import SplitBackground from '@/components/layout/SplitBackground.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import AtmosphereSection from '@/components/sections/AtmosphereSection.vue'
import EventsSection from '@/components/sections/EventsSection.vue'
import TopicsSection from '@/components/sections/TopicsSection.vue'
import JoinSection from '@/components/sections/JoinSection.vue'
</script>
