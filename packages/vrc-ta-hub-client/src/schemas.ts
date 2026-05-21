import { z } from 'zod'

export const WeekdayEnum = z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Other'])
export type WeekdaySymbol = z.infer<typeof WeekdayEnum>

/**
 * Wider weekday enum used by Event.weekday. The OpenAPI schema declares this as
 * WeekdayEnum | '' (BlankEnum), but the live API also returns uppercase variants
 * (e.g. 'THU', 'FRI'). Fixtures confirm both casings plus the empty string.
 */
export const EventWeekdayEnum = z.enum([
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Other',
  'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT',
  '',
])
export type EventWeekdaySymbol = z.infer<typeof EventWeekdayEnum>

export const PlatformEnum = z.enum(['All', 'PC'])
export type PlatformSymbol = z.infer<typeof PlatformEnum>

export const Community = z.object({
  id: z.number().int(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  start_time: z.string(),
  duration: z.number().int(),
  weekdays: z.array(WeekdayEnum),
  frequency: z.string(),
  organizers: z.string(),
  group_url: z.string(),
  group_id: z.string().nullable(),
  organizer_url: z.string(),
  sns_url: z.string(),
  discord: z.string(),
  twitter_hashtag: z.string(),
  poster_image: z.string().nullable(),
  description: z.string(),
  platform: PlatformEnum,
  tags: z.array(z.string()),
  allow_poster_repost: z.boolean(),
})
export type Community = z.infer<typeof Community>

export const Event = z.object({
  id: z.number().int(),
  community: Community,
  date: z.string(),
  start_time: z.string(),
  duration: z.number().int(),
  weekday: EventWeekdayEnum,
})
export type Event = z.infer<typeof Event>

export const EventDetail = z.object({
  id: z.number().int(),
  event: Event,
  start_time: z.string(),
  duration: z.number().int(),
  youtube_url: z.string().nullable(),
  slide_url: z.string().nullable(),
  thumbnail_image: z.string().nullable(),
  speaker: z.string(),
  theme: z.string(),
  additional_info: z.string(),
})
export type EventDetail = z.infer<typeof EventDetail>
