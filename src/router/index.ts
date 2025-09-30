import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import Trainings from '@/pages/Trainings.vue'
import Training from '@/pages/Training.vue'
import DefaultLayout from '@/Layouts/DefaultLayout.vue'
import Home from '@/pages/Home.vue'
import Session from '@/pages/Session.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', component: Home, name: 'Home' },
        { path: 'trainings', component: Trainings  , meta: { title: 'Entrainements' }},
        { path: 'trainings/:id', component: Training, name: 'training', meta: { title: 'Entrainement', noPadding: true } },
        { path: 'sessions/:id', component: Session, name: 'session', meta: { noPadding: true } },
      ],
    },
  ],
})

export default router
