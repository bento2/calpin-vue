import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import naive from 'naive-ui'

const app = createApp(App)


app.use(naive) // ou app.component('NImage', NImage)
app.use(createPinia())
app.use(router)
app.mount('#app')
