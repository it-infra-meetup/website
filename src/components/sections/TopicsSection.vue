<template>
  <section id="topics">
    <div class="content-wrapper">
      <div class="content-center">
        <h2 class="text-4xl font-bold main-text mb-10 text-neon">
          Topics
        </h2>
        <div class="flex flex-wrap justify-center gap-8">
          <div
            v-for="(topic, index) in topics"
            :key="index"
            class="group flex flex-col items-center gap-2"
          >
            <div
              class="topic-icon-box"
              :class="topic.hoverClasses"
            >
              <component
                :is="topic.icon"
                class="topic-icon"
                :class="topic.iconHoverClass"
              />
            </div>
            <span class="font-mono text-xs" :class="topic.labelColor">{{ topic.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { Network, HardDrive, Cloud } from '@lucide/vue'

type Topic = {
  icon: Component
  label: string
  hoverClasses: string
  iconHoverClass: string
  labelColor: string
}

const topics: Topic[] = [
  {
    icon: Network,
    label: "L1-L3",
    hoverClasses: "hover-primary",
    iconHoverClass: "icon-hover-primary",
    labelColor: "label-primary"
  },
  {
    icon: HardDrive,
    label: "Storage",
    hoverClasses: "hover-secondary",
    iconHoverClass: "icon-hover-secondary",
    labelColor: "label-secondary"
  },
  {
    icon: Cloud,
    label: "Cloud",
    hoverClasses: "hover-primary",
    iconHoverClass: "icon-hover-primary",
    labelColor: "label-primary"
  }
] satisfies Topic[]
</script>

<style scoped>
.main-text {
  color: var(--text-color);
}

.topic-icon-box {
  width: 4rem;
  height: 4rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.topic-icon {
  color: #999;
  transition: color 0.3s;
}

/* Primary color hover */
.group:hover .hover-primary {
  border-color: var(--primary-color);
  background-color: rgba(0, 123, 255, 0.1);
}

.group:hover .icon-hover-primary {
  color: var(--primary-color);
}

.label-primary {
  color: var(--primary-color);
}

/* Secondary color hover */
.group:hover .hover-secondary {
  border-color: var(--secondary-color);
  background-color: rgba(0, 188, 212, 0.1);
}

.group:hover .icon-hover-secondary {
  color: var(--secondary-color);
}

.label-secondary {
  color: var(--secondary-color);
}
</style>
