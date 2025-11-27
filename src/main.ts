import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@mdi/font/css/materialdesignicons.css'


import App from './App.vue'
import router from './router'
import { vuetify } from '@/plugins/vuetify.ts'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)

app.use(vuetify)
app.use(createPinia())
app.use(router)
app.mount('#app')
// service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nouvelle version disponible. Recharger ?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('App prête à fonctionner hors ligne')
  },
})
