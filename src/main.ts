import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'
import { vuetify } from '@/plugins/vuetify.ts'
import { registerSW } from 'virtual:pwa-register'

import { syncPlugin } from '@/plugins/syncPlugin.ts'

const app = createApp(App)

app.use(vuetify)
const pinia = createPinia()
pinia.use(syncPlugin)
app.use(pinia)
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
