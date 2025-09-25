import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import Trainings from '@/pages/Trainings.vue'
import Training from '@/components/Training.vue'
import DefaultLayout from '@/Layouts/DefaultLayout.vue'
import Home from '@/pages/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', component: Home },
        { path: 'trainings', component: Trainings  },
        { path: 'trainings/:id', component: Training },
      ],
    },
  ],
})

export default router
