import type { Community, Event, EventDetail } from '@vrc-ta-hub/client'

export const communityFixture: Community = {
  id: 30,
  name: 'ITインフラ集会',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  start_time: '22:00:00',
  duration: 90,
  weekdays: ['Sat'],
  frequency: 'weekly',
  organizers: 'ITインフラ集会',
  group_url: 'https://vrc.group/ITINFRA.0000',
  group_id: 'grp_00000000-0000-0000-0000-000000000000',
  organizer_url: 'https://example.com',
  sns_url: 'https://example.com',
  discord: 'https://discord.gg/example',
  twitter_hashtag: '#ITインフラ集会',
  poster_image: null,
  description: 'VRChatのITインフラ集会',
  platform: 'All',
  tags: ['インフラ', 'LT'],
  allow_poster_repost: true,
}

// NextEventCard reads: date, weekday, start_time, duration.
export const nextEventFixture: Event = {
  id: 1001,
  community: communityFixture,
  date: '2026-07-04',
  start_time: '22:00:00',
  duration: 90,
  weekday: 'Sat',
}

// EventsSection reads: id, event.date, theme, speaker.
function makeDetail(
  id: number,
  date: string,
  theme: string,
  speaker: string,
): EventDetail {
  return {
    id,
    event: { ...nextEventFixture, id, date },
    start_time: '22:10:00',
    duration: 15,
    youtube_url: null,
    slide_url: null,
    thumbnail_image: null,
    speaker,
    theme,
    additional_info: '',
  }
}

export const recentLtsFixture: EventDetail[] = [
  makeDetail(2003, '2026-05-30', 'Kubernetesでのネットワーク設計', 'alice'),
  makeDetail(2002, '2026-05-23', '自宅ラックの冷却最適化', 'bob'),
  makeDetail(2001, '2026-05-16', 'おうちLANのVLAN運用', 'carol'),
]
