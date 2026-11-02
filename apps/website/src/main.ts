import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupGoogleAnalytics } from './plugins/googleAnalytics'
import './assets/tailwind.css'
import './assets/main.css'

// GSAP プラグイン登録
import gsap from 'gsap'
import { ScrollTrigger, MotionPathPlugin } from 'gsap/all'
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
// 初回ナビゲーションの page_view を取りこぼさないよう、router を install する前に登録する
setupGoogleAnalytics(router)
app.use(router)
app.mount('#app')
