import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // State
  const isLoading = ref(true)
  const isModalOpen = ref(false)
  const latency = ref(12)

  // Getters
  const loading = computed(() => isLoading.value)
  const modalOpen = computed(() => isModalOpen.value)
  const latencyDisplay = computed(() => `${latency.value}ms`)

  // Actions
  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  function toggleModal(): void {
    isModalOpen.value = !isModalOpen.value
  }

  function openModal(): void {
    isModalOpen.value = true
  }

  function closeModal(): void {
    isModalOpen.value = false
  }

  function updateLatency(): void {
    latency.value = Math.floor(Math.random() * 15) + 3
  }

  return {
    // State
    isLoading,
    isModalOpen,
    latency,
    // Getters
    loading,
    modalOpen,
    latencyDisplay,
    // Actions
    setLoading,
    toggleModal,
    openModal,
    closeModal,
    updateLatency
  }
})
