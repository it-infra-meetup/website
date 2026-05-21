export { createClient } from './client'
export type {
  Client,
  ClientOptions,
  CallOptions,
  ListCommunitiesParams,
  ListEventsParams,
  ListEventDetailsParams,
} from './client'

export {
  Community,
  Event,
  EventDetail,
  WeekdayEnum,
  PlatformEnum,
} from './schemas'
export type {
  WeekdaySymbol,
  PlatformSymbol,
} from './schemas'

export type {
  ClientError,
  HttpError,
  NetworkError,
  ValidationError,
} from './errors'

export { ok, err, isOk, isErr, type Result } from './result'
