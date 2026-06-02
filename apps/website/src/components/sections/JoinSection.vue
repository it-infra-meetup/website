<template>
  <section id="join">
    <div class="content-wrapper">
      <div class="content-center w-full">
        <div class="glass-panel join-panel max-w-2xl">
          <h2 class="text-4xl md:text-6xl font-bold main-text mb-6">
            JOIN US
          </h2>
          <p class="muted-text mb-8">
            VRChatの世界で、あなたの接続を待っています。
          </p>
          <a
            href="https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419"
            target="_blank"
            rel="noopener noreferrer"
            class="join-button"
          >
            <span class="flex items-center gap-2">
              CONNECT TO VRCHAT
              <ExternalLink class="w-3 h-3" />
            </span>
          </a>
        </div>

        <!-- フッターは通常フロー内（中央寄せの安定領域）に置く。画面最下端に
             absolute で固定すると、iOS のアドレスバー伸縮とスナップ再調整で
             表示が遅れてガタつくため。 -->
        <footer class="mt-10 text-center text-[10px] muted-text font-mono">
          &copy; 2025 ITインフラ集会
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {ExternalLink} from '@lucide/vue'
</script>

<style scoped>
.main-text {
  color: var(--text-color);
}

.muted-text {
  color: var(--text-muted);
}

.join-panel {
  padding: 2.5rem;
  border-top: 4px solid var(--primary-color);
}

.join-button {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: transparent;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  transition: all 0.3s;
}

.join-button:hover {
  color: white;
  background-color: var(--primary-color);
}
</style>
