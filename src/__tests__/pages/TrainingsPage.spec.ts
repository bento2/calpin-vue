import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrainingsPage from '@/pages/TrainingsPage.vue'
import { useTrainingStore } from '@/stores/useTrainingStore'
import { nextTick } from 'vue'

// Mock components
vi.mock('@/components/TrainingCard.vue', () => ({
  default: {
    name: 'TrainingCard',
    props: ['training'],
    template: '<div class="training-card">{{ training.name }}</div>',
  },
}))

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push,
  }),
  useRoute: vi.fn(() => ({
    params: {},
  })),
}))

describe('Page Entrainements (TrainingsPage)', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useTrainingStore>
  let router: { push: Mock }

  const createWrapper = () => {
    return mount(TrainingsPage, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        stubs: {
          'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          'v-icon': true,
        },
      },
    })
  }

  beforeEach(async () => {
    wrapper = createWrapper()
    store = useTrainingStore()
    router = { push } as unknown as { push: Mock }

    // Setup store data using patch to ensure reactivity
    store.$patch({
      trainings: [
        { id: 't1', name: 'Entrainement 1', exercices: [], ctime: new Date(), mtime: new Date() },
        { id: 't2', name: 'Entrainement 2', exercices: [], ctime: new Date(), mtime: new Date() },
      ],
    })

    await nextTick()
  })

  it('affiche la liste des entrainements', () => {
    const cards = wrapper.findAllComponents({ name: 'TrainingCard' })
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('Entrainement 1')
  })

  it('crée un nouvel entrainement au clic sur le bouton', async () => {
    // Mock createTraining action
    const newTraining = { id: 't3', name: 'Nouvel Entrainement' }
    ;(store.createTraining as Mock).mockResolvedValue(newTraining)

    // Find the "Nouvel entrainement" button
    const buttons = wrapper.findAll('button')
    const createButton = buttons.find((b) => b.text().includes('Nouvel entrainement'))

    expect(createButton).toBeDefined()
    if (createButton) {
      await (wrapper.vm as unknown as { newTraining: () => Promise<void> }).newTraining()
      await flushPromises()

      expect(store.createTraining).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith({
        name: 'training',
        params: { id: 't3' },
      })
    }
  })
})
