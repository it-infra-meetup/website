<template>
  <section id="hero">
    <div class="content-wrapper">
      <div class="content-left">
        <div class="glass-panel bracket pointer-events-none md:pointer-events-auto">
          <div class="font-mono text-xs primary-text mb-2">
            TARGET: VRChat_Group
          </div>
          <picture>
            <source :srcset="`${baseUrl}ITlnfra.avif`" type="image/avif">
            <img :src="`${baseUrl}ITlnfra.png`" alt="ITインフラ集会" width="960" height="295" decoding="async">
          </picture>
        </div>
        <NextEventCard />
      </div>
      <div class="content-right flex flex-col items-end justify-center z-10">
        <div class="glass-panel p-8 max-w-md w-full text-left relative overflow-hidden group">
          <!-- 装飾的な背景 -->
          <div
            class="absolute top-0 right-0 w-20 h-20 bg-[var(--primary-color)]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
          />

          <h3 class="text-xl font-bold primary-text mb-6 flex items-center gap-2 border-b border-[var(--primary-color)]/20 pb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            HOW TO JOIN
          </h3>

          <div class="space-y-4 mb-8">
            <div v-for="(step, index) in joinSteps" :key="index" class="flex gap-3">
              <span
                class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary-color)]/20 primary-text flex items-center justify-center font-mono text-xs font-bold border border-[var(--primary-color)]/30"
              >{{
                index + 1
              }}</span>
              <div>
                <p class="text-sm font-bold main-text mb-1">
                  <template v-for="(seg, segIndex) in step.title" :key="segIndex">
                    <a
                      v-if="seg.href"
                      :href="seg.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-link"
                    >{{ seg.text }}</a><template v-else>
                      {{ seg.text }}
                    </template>
                  </template>
                </p>
                <p class="text-xs muted-text">
                  {{ step.description }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <p class="text-[10px] font-mono primary-text opacity-70 uppercase tracking-widest">
              Official Links
            </p>
            <div class="sns-links flex gap-4">
              <a
                :href="VRCHAT_GROUP_URL" target="_blank"
                rel="noopener noreferrer"
                class="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white/50 border border-[var(--primary-color)]/20 rounded hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)] transition-all muted-text hover:text-[var(--primary-color)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span class="text-xs font-bold">Group Page</span>
              </a>
              <a
                href="https://x.com/it_infra_meetup" target="_blank" rel="noopener noreferrer"
                class="p-2 bg-white/50 border border-gray-200 rounded hover:border-[#1DA1F2] hover:text-[#1DA1F2] hover:bg-white transition-all text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  />
                </svg>
              </a>
              <a
                :href="DISCORD_URL" target="_blank" rel="noopener noreferrer"
                class="p-2 bg-white/50 border border-gray-200 rounded hover:border-[#5865F2] hover:text-[#5865F2] hover:bg-white transition-all text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div
          class="text-xs font-mono primary-text opacity-50 transform rotate-90 origin-bottom-right absolute bottom-10 right-10"
        >
          CONNECTION_ID: {{ connectionId }}
        </div>
      </div>
    </div>
    <div class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce primary-text">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {fetchPublicIp} from '@/clients/ipify'
import NextEventCard from '@/components/sections/NextEventCard.vue'
import {
  DISCORD_URL,
  VRCHAT_REGISTER_URL,
  VRCHAT_DOWNLOAD_URL,
  VRCHAT_GROUP_URL,
  VRCHAT_GROUP_INSTANCES_URL,
} from '@/consts/links'

const baseUrl = import.meta.env.BASE_URL

type TextSegment = {
  text: string
  href?: string
}

type JoinStep = {
  title: TextSegment[]
  description?: string
}

const joinSteps: JoinStep[] = [
  {
    title: [{text: 'Discord', href: DISCORD_URL}, {text: 'サーバーに参加'}],
    description: 'Discordサーバーで他のコミュニティメンバーと交流できます。参加方法などの質問も受け付けています。',
  },
  {
    title: [{text: 'VRChat', href: VRCHAT_REGISTER_URL}, {text: 'に登録'}],
  },
  {
    title: [{text: 'VRChat', href: VRCHAT_DOWNLOAD_URL}, {text: 'をダウンロード'}],
    description: '対応: Windows / Linux / Android / iOS',
  },
  {
    title: [{text: 'VRChatグループ', href: VRCHAT_GROUP_URL}, {text: 'に参加'}],
    description: '事前にグループに入っておくと、簡単に参加できます。',
  },
  {
    title: [
      {text: '開催時刻になったら'},
      {text: 'Group+インスタンス', href: VRCHAT_GROUP_INSTANCES_URL},
      {text: 'にJoin！'},
    ],
  },
]

const connectionId = ref('0x-----')

// 文字列から簡易ハッシュを生成
const hashToConnectionId = (source: string): string => {
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    const char = source.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit整数に変換
  }
  // 正の値にして5桁の16進数に変換
  const hex = Math.abs(hash).toString(16).toUpperCase().slice(0, 5).padStart(5, '0')
  return `0x${hex}`
}

const randomConnectionId = (): string => {
  const randomHex = Math.floor(Math.random() * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0')
  return `0x${randomHex}`
}

onMounted(async () => {
  try {
    const ip = await fetchPublicIp()
    connectionId.value = hashToConnectionId(ip)
  } catch {
    connectionId.value = randomConnectionId()
  }
})
</script>

<style scoped>
.primary-text {
  color: var(--primary-color);
}

.main-text {
  color: var(--text-color);
}

.muted-text {
  color: var(--text-muted);
}
</style>
