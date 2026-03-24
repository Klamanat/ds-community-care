import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './styles/global.css'
import { inject } from '@vercel/analytics'

inject()

// ล้าง localStorage cache เก่าที่อาจมี base64 images ขนาดใหญ่

// เพิ่ม version ทุกครั้งที่ cache structure เปลี่ยน
;(function purgeLegacyCache() {
  const CACHE_VER = 'dsc_v2'
  if (localStorage.getItem(CACHE_VER)) return
  Object.keys(localStorage)
    .filter(k => k.startsWith('dsc_'))
    .forEach(k => localStorage.removeItem(k))
  localStorage.setItem(CACHE_VER, '1')
})()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
