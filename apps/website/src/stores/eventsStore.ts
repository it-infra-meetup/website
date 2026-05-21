import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createClient, isOk, isErr, type ClientError } from '@vrc-ta-hub/client'

const client = createClient()

/** VRC TA Hub community id for ITインフラ集会. The API has no community-id
 *  filter (only `name` icontains), so we fetch and filter client-side. */
const IT_INFRA_COMMUNITY_ID = 30

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useEventsStore = defineStore('events', () => {
  // State
  const count = ref<number | null>(null)
  const error = ref<ClientError | null>(null)
  const loading = ref(false)

  // Getters
  const hasError = computed(() => error.value !== null)
  const hasCount = computed(() => count.value !== null)

  // Actions
  async function loadUpcoming(): Promise<void> {
    loading.value = true
    error.value = null
    const result = await client.listEvents({ start_date: todayIso() })
    loading.value = false
    if (isOk(result)) {
      count.value = result.data.filter((e) => e.community.id === IT_INFRA_COMMUNITY_ID).length
      return
    }
    if (isErr(result) && result.error.kind === 'network' && result.error.aborted) {
      // Cancelled — not a real error.
      return
    }
    error.value = result.error
  }

  return {
    // State
    count,
    error,
    loading,
    // Getters
    hasError,
    hasCount,
    // Actions
    loadUpcoming
  }
})
