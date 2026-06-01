import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import {
  createClient,
  isOk,
  isErr,
  type ClientError,
  type Event,
  type EventDetail,
} from '@vrc-ta-hub/client'

const client = createClient()

/** VRC TA Hub community id for ITインフラ集会. Used for server-side
 *  exact-match filtering on `/api/v1/event/?community=<id>` and
 *  `/api/v1/event_detail/?community=<id>`. */
const IT_INFRA_COMMUNITY_ID = 30

/** Window we look ahead for the next event. */
const LOOKAHEAD_DAYS = 31

/** Window we look back for recent LT history. */
const LOOKBACK_DAYS = 90

/** How many recent LTs to keep for the Recent Events section. */
const RECENT_LT_LIMIT = 3

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

function lookbackIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - LOOKBACK_DAYS)
  return isoDate(d)
}

interface EventsStoreState {
  nextEvent: Ref<Event | null>
  recentLts: Ref<EventDetail[]>
  error: Ref<ClientError | null>
  recentLtsError: Ref<ClientError | null>
  loading: Ref<boolean>
  recentLtsLoading: Ref<boolean>
  hasError: ComputedRef<boolean>
  hasNextEvent: ComputedRef<boolean>
  hasRecentLtsError: ComputedRef<boolean>
  hasRecentLts: ComputedRef<boolean>
  loadNext: () => Promise<void>
  loadRecentLts: () => Promise<void>
}

export const useEventsStore = defineStore('events', (): EventsStoreState => {
  // State
  const nextEvent = ref<Event | null>(null)
  const recentLts = ref<EventDetail[]>([])
  const error = ref<ClientError | null>(null)
  const recentLtsError = ref<ClientError | null>(null)
  const loading = ref(false)
  const recentLtsLoading = ref(false)

  // Getters
  const hasError = computed(() => error.value !== null)
  const hasNextEvent = computed(() => nextEvent.value !== null)
  const hasRecentLtsError = computed(() => recentLtsError.value !== null)
  const hasRecentLts = computed(() => recentLts.value.length > 0)

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

  async function loadRecentLts(): Promise<void> {
    recentLtsLoading.value = true
    recentLtsError.value = null
    const result = await client.listEventDetails({
      community: IT_INFRA_COMMUNITY_ID,
      start_date: lookbackIso(),
      end_date: todayIso(),
    })
    recentLtsLoading.value = false
    if (isOk(result)) {
      const sorted = [...result.data].sort((a, b) => {
        const dateCmp = b.event.date.localeCompare(a.event.date)
        if (dateCmp !== 0) return dateCmp
        return b.start_time.localeCompare(a.start_time)
      })
      recentLts.value = sorted.slice(0, RECENT_LT_LIMIT)
      return
    }
    if (isErr(result) && result.error.kind === 'network' && result.error.aborted) {
      return
    }
    recentLtsError.value = result.error
  }

  return {
    // State
    nextEvent,
    recentLts,
    error,
    recentLtsError,
    loading,
    recentLtsLoading,
    // Getters
    hasError,
    hasNextEvent,
    hasRecentLtsError,
    hasRecentLts,
    // Actions
    loadNext,
    loadRecentLts,
  }
})
