import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  // ページ遷移時は先頭から表示する（ブラウザの戻る/進むでは元の位置を復元）。
  // html の scroll-behavior: smooth で遷移後にスクロールアニメーションが走らないよう instant にする。
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0, behavior: 'instant' }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/lt-list',
      name: 'lt-list',
      component: () => import('@/views/LtListView.vue')
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyView.vue')
    }
  ]
})

export default router
