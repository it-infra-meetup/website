import { describe, it, expect } from 'vitest'
import { createClient } from '../src/client'
import { isOk } from '../src/result'
import communityFixture from './__fixtures__/community.json'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('createClient', () => {
  it('listCommunities returns ok(data) and calls the right URL', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fakeFetch: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init })
      return jsonResponse(communityFixture)
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
