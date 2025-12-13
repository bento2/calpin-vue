import { createRouter, createWebHistory } from 'vue-router'
import Trainings from '@/pages/TrainingsPage.vue'
import Training from '@/pages/TrainingPage.vue'
import DefaultLayout from '@/Layouts/DefaultLayout.vue'
import Home from '@/pages/HomePage.vue'
import Session from '@/pages/SessionPage.vue'
import ExercicesPage from '@/pages/ExercicesPage.vue'
import HistoryPage from '@/pages/HistoryPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', component: Home, name: 'Home' },
        {
          path: 'exercices',
          component: ExercicesPage,
          name: 'exercices',
          meta: { title: 'Exercices' },
        },
        {
          path: 'history',
          component: HistoryPage,
          name: 'history',
          meta: { title: 'Historiques' },
        },
        {
          path: 'trainings',
          component: Trainings,
          name: 'trainings',
          meta: { title: 'Entrainements' },
        },
        {
          path: 'trainings/:id',
          component: Training,
          name: 'training',
          meta: { title: 'Entrainement', noPadding: true },
        },
        { path: 'sessions/:id', component: Session, name: 'session', meta: { noPadding: true } },
      ],
    },
  ],
})

export default router
