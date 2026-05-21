import type { $ZodIssue } from 'zod/v4/core'

export interface HttpError {
  kind: 'http'
  status: number
  statusText: string
  url: string
  /** Raw response body text, capped at 2048 chars. Null if reading the body failed. */
  body: string | null
}

export interface NetworkError {
  kind: 'network'
  url: string
  /** The original error thrown by fetch (or response.json()). */
  cause: unknown
  /** True when the call was cancelled via AbortSignal. */
  aborted: boolean
}

export interface ValidationError {
  kind: 'validation'
  url: string
  issues: $ZodIssue[]
}

export type ClientError = HttpError | NetworkError | ValidationError
