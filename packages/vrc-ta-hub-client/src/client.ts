import { z } from 'zod'
import {
  Community,
  Event,
  EventDetail,
  type WeekdaySymbol,
} from './schemas'
import type { ClientError } from './errors'
import { err, ok, type Result } from './result'
import { buildUrl, normalizeBaseUrl, type QueryValue } from './url'

export interface ClientOptions {
  /** Defaults to 'https://vrc-ta-hub.com'. Trailing slash is normalized off. */
  baseUrl?: string
  /** Defaults to globalThis.fetch. Inject for tests or custom transport. */
  fetch?: typeof globalThis.fetch
}

export interface CallOptions {
  signal?: AbortSignal
}

export interface ListCommunitiesParams {
  name?: string
  weekdays?: WeekdaySymbol
}

export interface ListEventsParams {
  name?: string
  weekday?: WeekdaySymbol
  start_date?: string
  end_date?: string
}

export interface ListEventDetailsParams {
  theme?: string
  speaker?: string
  start_date?: string
  end_date?: string
  start_time?: string
}

export interface Client {
  listCommunities(params?: ListCommunitiesParams, opts?: CallOptions): Promise<Result<Community[], ClientError>>
  getCommunity(id: number, opts?: CallOptions): Promise<Result<Community, ClientError>>
  listEvents(params?: ListEventsParams, opts?: CallOptions): Promise<Result<Event[], ClientError>>
  getEvent(id: number, opts?: CallOptions): Promise<Result<Event, ClientError>>
  listEventDetails(params?: ListEventDetailsParams, opts?: CallOptions): Promise<Result<EventDetail[], ClientError>>
  getEventDetail(id: number, opts?: CallOptions): Promise<Result<EventDetail, ClientError>>
}

const DEFAULT_BASE_URL = 'https://vrc-ta-hub.com'
const BODY_PREVIEW_CAP = 2048

async function request<T>(
  fetchImpl: typeof fetch,
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal | undefined,
): Promise<Result<T, ClientError>> {
  let response: Response
  try {
    response = await fetchImpl(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (cause) {
    return err({
      kind: 'network',
      url,
      cause,
      aborted: cause instanceof DOMException && cause.name === 'AbortError',
    })
  }

  if (!response.ok) {
    let body: string | null = null
    try {
      body = (await response.text()).slice(0, BODY_PREVIEW_CAP)
    } catch {
      body = null
    }
    return err({
      kind: 'http',
      status: response.status,
      statusText: response.statusText,
      url,
      body,
    })
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch (cause) {
    return err({ kind: 'network', url, cause, aborted: false })
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return err({ kind: 'validation', url, issues: parsed.error.issues })
  }
  return ok(parsed.data)
}

export function createClient(options: ClientOptions = {}): Client {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
  const fetchImpl = options.fetch ?? globalThis.fetch

  const list = <T>(
    path: string,
    params: Record<string, QueryValue>,
    schema: z.ZodType<T[]>,
    signal?: AbortSignal,
  ): Promise<Result<T[], ClientError>> =>
    request<T[]>(fetchImpl, buildUrl(baseUrl, path, params), schema, signal)

  const retrieve = <T>(
    path: string,
    id: number,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
  ): Promise<Result<T, ClientError>> =>
    request<T>(fetchImpl, buildUrl(baseUrl, `${path}${id}/`, {}), schema, signal)

  return {
    listCommunities: (params = {}, opts) =>
      list<Community>(
        '/api/v1/community/',
        { name: params.name, weekdays: params.weekdays },
        z.array(Community),
        opts?.signal,
      ),
    getCommunity: (id, opts) => retrieve<Community>('/api/v1/community/', id, Community, opts?.signal),

    listEvents: (params = {}, opts) =>
      list<Event>(
        '/api/v1/event/',
        { name: params.name, weekday: params.weekday, start_date: params.start_date, end_date: params.end_date },
        z.array(Event),
        opts?.signal,
      ),
    getEvent: (id, opts) => retrieve<Event>('/api/v1/event/', id, Event, opts?.signal),

    listEventDetails: (params = {}, opts) =>
      list<EventDetail>(
        '/api/v1/event_detail/',
        {
          theme: params.theme,
          speaker: params.speaker,
          start_date: params.start_date,
          end_date: params.end_date,
          start_time: params.start_time,
        },
        z.array(EventDetail),
        opts?.signal,
      ),
    getEventDetail: (id, opts) => retrieve<EventDetail>('/api/v1/event_detail/', id, EventDetail, opts?.signal),
  }
}
