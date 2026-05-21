import { describe, it, expect } from 'vitest'
import { buildUrl, normalizeBaseUrl } from '../src/url'

describe('normalizeBaseUrl', () => {
  it('strips trailing slash', () => {
    expect(normalizeBaseUrl('https://vrc-ta-hub.com/')).toBe('https://vrc-ta-hub.com')
  })

  it('leaves a clean URL alone', () => {
    expect(normalizeBaseUrl('https://vrc-ta-hub.com')).toBe('https://vrc-ta-hub.com')
  })

  it('strips multiple trailing slashes', () => {
    expect(normalizeBaseUrl('https://vrc-ta-hub.com///')).toBe('https://vrc-ta-hub.com')
  })
})

describe('buildUrl', () => {
  it('joins base + path with format=json', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/community/', {})).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json',
    )
  })

  it('skips undefined params', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/event/', { name: undefined, weekday: 'Mon' })).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json&weekday=Mon',
    )
  })

  it('skips null params', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/event/', { name: null })).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json',
    )
  })

  it('encodes special chars', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/community/', { name: 'VRC通信' })).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json&name=VRC%E9%80%9A%E4%BF%A1',
    )
  })

  it('passes through numbers and booleans by string conversion', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/event/', { id: 42, flag: true })).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json&id=42&flag=true',
    )
  })

  it('honors a baseUrl with trailing slash via normalizeBaseUrl', () => {
    expect(buildUrl(normalizeBaseUrl('https://vrc-ta-hub.com/'), '/api/v1/community/', {})).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json',
    )
  })
})
