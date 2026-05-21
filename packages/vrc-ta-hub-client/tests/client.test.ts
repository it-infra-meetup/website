import { describe, it, expect } from 'vitest'
import { createClient } from '../src/client'
import { isOk, isErr } from '../src/result'
import communityFixture from './__fixtures__/community.json'
import eventFixture from './__fixtures__/event.json'
import eventDetailFixture from './__fixtures__/event_detail.json'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

describe('createClient', () => {
  it('listCommunities returns ok(data) and calls the right URL', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fakeFetch: typeof fetch = (input, init) => {
      calls.push({ url: urlOf(input), init })
      return Promise.resolve(jsonResponse(communityFixture))
    }

    const client = createClient({ fetch: fakeFetch })
    const r = await client.listCommunities({ name: 'VRC', weekdays: 'Sat' })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json&name=VRC&weekdays=Sat',
    )
    expect(isOk(r)).toBe(true)
    if (isOk(r)) {
      expect(r.data.length).toBe((communityFixture as unknown[]).length)
    }
  })
})

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response): typeof fetch {
  return (input, init) => Promise.resolve(handler(urlOf(input), init))
}

describe('createClient — full surface', () => {
  it('getCommunity hits /api/v1/community/{id}/', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse((communityFixture as Array<{ id: number }>)[0])
      }),
    })
    const r = await client.getCommunity(101)
    expect(seen[0]).toBe('https://vrc-ta-hub.com/api/v1/community/101/?format=json')
    expect(isOk(r)).toBe(true)
  })

  it('listEvents forwards filter params', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse(eventFixture)
      }),
    })
    const r = await client.listEvents({ start_date: '2026-05-20', end_date: '2026-06-01', weekday: 'Wed', name: 'VRC' })
    expect(seen[0]).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json&name=VRC&weekday=Wed&start_date=2026-05-20&end_date=2026-06-01',
    )
    expect(isOk(r)).toBe(true)
  })

  it('listEvents forwards community id as integer query param', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse(eventFixture)
      }),
    })
    await client.listEvents({ community: 30, start_date: '2026-05-21', end_date: '2026-06-21' })
    expect(seen[0]).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json&community=30&start_date=2026-05-21&end_date=2026-06-21',
    )
  })

  it('getEvent hits /api/v1/event/{id}/', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse((eventFixture as Array<{ id: number }>)[0])
      }),
    })
    await client.getEvent(4490)
    expect(seen[0]).toBe('https://vrc-ta-hub.com/api/v1/event/4490/?format=json')
  })

  it('listEventDetails forwards filter params', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse(eventDetailFixture)
      }),
    })
    await client.listEventDetails({ theme: 'math', speaker: 'eda', start_date: '2026-05-20', end_date: '2026-08-01', start_time: '21:00:00' })
    expect(seen[0]).toBe(
      'https://vrc-ta-hub.com/api/v1/event_detail/?format=json&theme=math&speaker=eda&start_date=2026-05-20&end_date=2026-08-01&start_time=21%3A00%3A00',
    )
  })

  it('getEventDetail hits /api/v1/event_detail/{id}/', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse((eventDetailFixture as Array<{ id: number }>)[0])
      }),
    })
    await client.getEventDetail(266)
    expect(seen[0]).toBe('https://vrc-ta-hub.com/api/v1/event_detail/266/?format=json')
  })

  it('returns http error on non-2xx with body preview', async () => {
    const client = createClient({
      fetch: stubFetch(() => new Response('upstream exploded', { status: 500, statusText: 'Internal Server Error' })),
    })
    const r = await client.listEvents()
    expect(isErr(r)).toBe(true)
    if (isErr(r) && r.error.kind === 'http') {
      expect(r.error.status).toBe(500)
      expect(r.error.statusText).toBe('Internal Server Error')
      expect(r.error.body).toBe('upstream exploded')
    } else {
      throw new Error('expected http error')
    }
  })

  it('returns http 404 from getCommunity', async () => {
    const client = createClient({
      fetch: stubFetch(() => new Response('Not found', { status: 404, statusText: 'Not Found' })),
    })
    const r = await client.getCommunity(99999)
    expect(isErr(r)).toBe(true)
    if (isErr(r) && r.error.kind === 'http') {
      expect(r.error.status).toBe(404)
    } else {
      throw new Error('expected http error')
    }
  })

  it('caps body preview at 2048 chars', async () => {
    const big = 'x'.repeat(5000)
    const client = createClient({
      fetch: stubFetch(() => new Response(big, { status: 502, statusText: 'Bad Gateway' })),
    })
    const r = await client.listEvents()
    if (isErr(r) && r.error.kind === 'http') {
      expect(r.error.body?.length).toBe(2048)
    } else {
      throw new Error('expected http error')
    }
  })

  it('returns validation error on malformed JSON shape', async () => {
    const client = createClient({
      fetch: stubFetch(() => jsonResponse({ not: 'an array' })),
    })
    const r = await client.listEvents()
    expect(isErr(r)).toBe(true)
    if (isErr(r)) expect(r.error.kind).toBe('validation')
  })

  it('returns network error when fetch throws', async () => {
    const client = createClient({
      fetch: stubFetch(() => {
        throw new TypeError('failed to fetch')
      }),
    })
    const r = await client.listEvents()
    if (isErr(r) && r.error.kind === 'network') {
      expect(r.error.aborted).toBe(false)
      expect(r.error.cause).toBeInstanceOf(TypeError)
    } else {
      throw new Error('expected network error')
    }
  })

  it('returns network error with aborted=true on AbortError', async () => {
    const client = createClient({
      fetch: stubFetch(() => {
        throw new DOMException('aborted', 'AbortError')
      }),
    })
    const r = await client.listEvents()
    if (isErr(r) && r.error.kind === 'network') {
      expect(r.error.aborted).toBe(true)
    } else {
      throw new Error('expected aborted network error')
    }
  })

  it('forwards AbortSignal to fetch', async () => {
    const seenSignals: (AbortSignal | undefined)[] = []
    const ctrl = new AbortController()
    const client = createClient({
      fetch: stubFetch((_url, init) => {
        seenSignals.push(init?.signal ?? undefined)
        return jsonResponse(communityFixture)
      }),
    })
    await client.listCommunities({}, { signal: ctrl.signal })
    expect(seenSignals[0]).toBe(ctrl.signal)
  })

  it('honors custom baseUrl with trailing slash', async () => {
    const seen: string[] = []
    const client = createClient({
      baseUrl: 'https://staging.example.com/',
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse(communityFixture)
      }),
    })
    await client.listCommunities()
    expect(seen[0]).toBe('https://staging.example.com/api/v1/community/?format=json')
  })
})

import * as publicSurface from '../src/index'

describe('public surface', () => {
  it('exports createClient and Result helpers as functions', () => {
    expect(typeof publicSurface.createClient).toBe('function')
    expect(typeof publicSurface.ok).toBe('function')
    expect(typeof publicSurface.err).toBe('function')
    expect(typeof publicSurface.isOk).toBe('function')
    expect(typeof publicSurface.isErr).toBe('function')
  })

  it('exports the zod schemas', () => {
    expect(typeof publicSurface.Community.safeParse).toBe('function')
    expect(typeof publicSurface.Event.safeParse).toBe('function')
    expect(typeof publicSurface.EventDetail.safeParse).toBe('function')
  })
})
