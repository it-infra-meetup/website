import { describe, it, expect } from 'vitest'
import { ok, err, isOk, isErr, type Result } from '../src/result'

describe('Result helpers', () => {
  it('ok() returns { ok: true, data }', () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 })
  })

  it('err() returns { ok: false, error }', () => {
    expect(err('boom')).toEqual({ ok: false, error: 'boom' })
  })

  it('isOk narrows to data branch', () => {
    const r: Result<number, string> = ok(7)
    if (isOk(r)) {
      const n: number = r.data
      expect(n).toBe(7)
    } else {
      throw new Error('expected ok')
    }
  })

  it('isErr narrows to error branch', () => {
    const r: Result<number, string> = err('nope')
    if (isErr(r)) {
      const e: string = r.error
      expect(e).toBe('nope')
    } else {
      throw new Error('expected err')
    }
  })
})
