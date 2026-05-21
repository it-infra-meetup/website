import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createClient,
  isOk,
  isErr,
  type ClientError,
  type Event,
} from '@vrc-ta-hub/client'

const client = createClient()

/** VRC TA Hub community id for ITインフラ集会. Used for server-side
 *  exact-match filtering on `/api/v1/event/?community=<id>`. */
const IT_INFRA_COMMUNITY_ID = 30

/** Window we look ahead for the next event. */
const LOOKAHEAD_DAYS = 31

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return isoDate(new Date())
}

function lookaheadIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + LOOKAHEAD_DAYS)
  return isoDate(d)
}

export const useEventsStore = defineStore('events', () => {
  // State
  const nextEvent = ref<Event | null>(null)
  const error = ref<ClientError | null>(null)
  const loading = ref(false)

  // Getters
  const hasError = computed(() => error.value !== null)
  const hasNextEvent = computed(() => nextEvent.value !== null)

  // Actions
  async function loadNext(): Promise<void> {
    loading.value = true
    error.value = null
    const result = await client.listEvents({
      community: IT_INFRA_COMMUNITY_ID,
      start_date: todayIso(),
      end_date: lookaheadIso(),
    })
    loading.value = false
    if (isOk(result)) {
      // Server returns events sorted by date,start_time — first item is the
      // next upcoming session. Empty array means no event in the window.
      nextEvent.value = result.data[0] ?? null
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
    nextEvent,
    error,
    loading,
    // Getters
    hasError,
    hasNextEvent,
    // Actions
    loadNext,
  }
})
