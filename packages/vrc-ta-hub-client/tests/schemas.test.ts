import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { Community, Event, EventDetail } from '../src/schemas'
import communityFixture from './__fixtures__/community.json'
import eventFixture from './__fixtures__/event.json'
import eventDetailFixture from './__fixtures__/event_detail.json'

describe('schemas vs. captured fixtures', () => {
  it('Community schema parses every record in community.json', () => {
    const result = z.array(Community).safeParse(communityFixture)
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2))
    expect(result.success).toBe(true)
  })

  it('Event schema parses every record in event.json', () => {
    const result = z.array(Event).safeParse(eventFixture)
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2))
    expect(result.success).toBe(true)
  })

  it('EventDetail schema parses every record in event_detail.json', () => {
    const result = z.array(EventDetail).safeParse(eventDetailFixture)
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2))
    expect(result.success).toBe(true)
  })

  it('Community fixture exercises nullable group_id and poster_image', () => {
    const parsed = z.array(Community).parse(communityFixture)
    expect(parsed.some((c) => c.group_id === null)).toBe(true)
    expect(parsed.some((c) => c.poster_image === null)).toBe(true)
  })

  it('weekdays is always a non-empty array of weekday codes', () => {
    const parsed = z.array(Community).parse(communityFixture)
    for (const c of parsed) {
      expect(Array.isArray(c.weekdays)).toBe(true)
      expect(c.weekdays.length).toBeGreaterThan(0)
    }
  })
})
