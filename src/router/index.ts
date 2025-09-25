import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import Trainings from '@/Trainings.vue'
import Training from '@/components/Training.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: App },
    { path: '/trainings', component: Trainings },
    { path: '/trainings/:id', component: Training },
  ],
})

export default router
