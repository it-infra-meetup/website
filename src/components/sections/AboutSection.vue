<template>
  <section id="about">
    <div class="about-container">
      <!-- スマホ: 2番目に表示 / デスクトップ: 左側 -->
      <div class="about-video">
        <div class="video-placeholder">
          <div class="placeholder-content">
            <span class="placeholder-icon">▶</span>
            <span class="placeholder-text">Video Coming Soon</span>
          </div>
        </div>
      </div>

      <!-- デスクトップ: 右側（縦中央揃え） -->
      <div class="about-right">
        <!-- スマホ: 最初に表示 -->
        <div class="about-header">
          <div class="flex items-center justify-end gap-4">
            <h2 class="text-3xl font-bold main-text">
              ITインフラ集会とは
            </h2>
            <span class="font-mono text-4xl primary-text opacity-50">01</span>
          </div>
        </div>

        <!-- スマホ: 3番目に表示 -->
        <div class="about-text glass-panel bracket">
          <p class="muted-text text-sm leading-relaxed mb-4">
            VRChatの中で開催される、ITインフラについて<br>
            みんなで語り合い知識を共有し合う集会です<br>
            設計・構築・運用・相談したい人々が集まります<br>
            データセンター、ISP、クラウド、社内SE...etc<br>
          </p>
          <div class="flex gap-2 justify-end flex-wrap font-mono text-xs primary-text">
            <span class="tag">DATACENTER</span>
            <span class="tag">NETWORK</span>
            <span class="tag">CLOUD</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.main-text {
  color: var(--text-color);
}

.primary-text {
  color: var(--primary-color);
}

.muted-text {
  color: var(--text-muted);
}

.tag {
  border: 1px solid rgba(0, 123, 255, 0.5);
  padding: 0.25rem 0.5rem;
}

/* コンテナレイアウト */
.about-container {
  pointer-events: auto;
  max-width: 1200px;
  width: 100%;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
}

/* デスクトップ: 左側に動画 */
.about-video {
  display: flex;
  align-items: center;
}

/* デスクトップ: 右側にタイトル+テキスト（縦中央揃え） */
.about-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;
}

.about-header {
  display: flex;
  justify-content: flex-end;
}

.about-text {
  text-align: right;
}

/* 動画プレースホルダー */
.video-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, rgba(0, 123, 255, 0.1) 0%, rgba(0, 123, 255, 0.05) 100%);
  border: 2px dashed rgba(0, 123, 255, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  opacity: 0.6;
}

.placeholder-icon {
  font-size: 3rem;
}

.placeholder-text {
  font-family: monospace;
  font-size: 0.875rem;
}

/* スマホ表示: タイトル → 動画 → テキスト の順 */
@media (max-width: 899px) {
  .about-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  /* about-rightを展開して中身を直接gridに配置 */
  .about-right {
    display: contents;
  }

  .about-header {
    order: 1;
    justify-content: center;
  }

  .about-header .flex {
    justify-content: center;
  }

  .about-video {
    order: 2;
  }

  .about-text {
    order: 3;
    text-align: center;
    width: 100%;
  }

  .about-text .flex {
    justify-content: center;
  }
}
</style>
