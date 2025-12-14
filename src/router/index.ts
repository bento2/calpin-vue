import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/Layouts/DefaultLayout.vue'
import Home from '@/pages/HomePage.vue'

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
          component: () => import('@/pages/ExercicesPage.vue'),
          name: 'exercices',
          meta: { title: 'Exercices' },
        },
        {
          path: 'history',
          component: () => import('@/pages/HistoryPage.vue'),
          name: 'history',
          meta: { title: 'Historiques' },
        },
        {
          path: 'trainings',
          component: () => import('@/pages/TrainingsPage.vue'),
          name: 'trainings',
          meta: { title: 'Entrainements' },
        },
        {
          path: 'trainings/:id',
          component: () => import('@/pages/TrainingPage.vue'),
          name: 'training',
          meta: { title: 'Entrainement', noPadding: true },
        },
        {
          path: 'sessions/:id',
          component: () => import('@/pages/SessionPage.vue'),
          name: 'session',
          meta: { noPadding: true },
        },
      ],
    },
  ],
})

export default router
