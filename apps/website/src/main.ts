import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'
import './assets/main.css'

// GSAP プラグイン登録
import gsap from 'gsap'
import { ScrollTrigger, MotionPathPlugin } from 'gsap/all'
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
