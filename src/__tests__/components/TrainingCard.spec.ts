import { describe, it, expect, vi, type Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrainingCard from '@/components/TrainingCard.vue'
import type { Training } from '@/types/TrainingSchema'
import type { Exercice } from '@/types/ExerciceSchema'
import { useSessionStore } from '@/stores/useSessionStore'
import { type Pinia } from 'pinia'
import { useTrainingStore } from '@/stores/useTrainingStore'

import { flushPromises } from '@vue/test-utils'

// Mock useRouter
// Mock useRouter
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('TrainingCard', () => {
  const mockExercice: Exercice = {
    id: '1',
    name: 'Pompes',
    icon: '/icons/push-up.png',
    difficulty: 'débutant',
    hasEquipment: false,
  }

  const mockTraining: Training = {
    id: 'training-1',
    name: 'Entraînement du jour',
    exercices: [mockExercice],
    ctime: new Date(),
    mtime: new Date(),
  }

  const createWrapper = (props = {}, piniaInstance?: Pinia) => {
    return mount(TrainingCard, {
      props: {
        training: mockTraining,
        ...props,
      },
      global: {
        plugins: [
          piniaInstance ||
            createTestingPinia({
              createSpy: vi.fn,
            }),
        ],
        stubs: {
          'v-btn': {
            template: '<button class="v-btn-stub" @click="$emit(\'click\')"><slot /></button>',
            props: ['icon'],
          },
          'v-card': true,
          'v-card-title': true,
          'v-card-text': true,
          AppBtn: {
            name: 'AppBtn', // Easing findComponent
            template:
              '<button class="app-btn-stub" :icon="icon" @click="$emit(\'click\')"></button>',
            props: ['icon'],
          },
          AppCard: {
            template: '<div><slot /><slot name="headerActions" /></div>',
          },
          ExerciceIcon: true,
        },
      },
    })
  }

  it("affiche le nom de l'entrainement", () => {
    const wrapper = createWrapper()
    expect(wrapper.html()).toContain('Entraînement du jour')
  })

  it("affiche quand l'entrainement est indéfini", () => {
    const wrapper = mount(TrainingCard, {
      props: {
        training: undefined as unknown as Training,
      },
      global: {
        stubs: { AppCard: true },
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })
    expect(wrapper.text()).toContain("n'existe pas")
    expect(wrapper.findComponent({ name: 'AppCard' }).exists()).toBe(false)
  })

  it('navigue vers la session au clic sur play', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useSessionStore(pinia)
    ;(store.createSession as Mock).mockResolvedValue({ id: 'session-123' })

    const wrapper = createWrapper({}, pinia)

    const playBtn = wrapper
      .findAll('.app-btn-stub')
      .find((w) => w.attributes('icon') === 'mdi-play')

    expect(playBtn?.exists()).toBe(true)
    await playBtn?.trigger('click')

    expect(store.createSession).toHaveBeenCalledWith(mockTraining)
    expect(store.createSession).toHaveBeenCalledWith(mockTraining)
    await flushPromises()
    expect(store.createSession).toHaveBeenCalledWith(mockTraining)
    await flushPromises()
    expect(pushMock).toHaveBeenCalledWith({ name: 'session', params: { id: 'session-123' } })
  })

  it('exécute la suppression au clic sur delete', async () => {
    const wrapper = createWrapper({ showDelete: true })
    const store = useTrainingStore()

    // Find by class and verify prop via Vue Wrapper if possible?
    // Or just bind prop to attribute in stub: :icon="icon"
    // See Stub update below.
    const deleteBtn = wrapper
      .findAll('.app-btn-stub')
      .find((w) => w.attributes('icon') === 'mdi-delete')

    expect(deleteBtn?.exists()).toBe(true)
    await deleteBtn?.trigger('click')

    expect(store.deleteTrainingById).toHaveBeenCalledWith('training-1')
  })

  it('masque le bouton supprimer si showDelete est false', async () => {
    const wrapper = createWrapper({ showDelete: false })

    // Use class selector matching the stub template
    const deleteBtn = wrapper
      .findAll('.app-btn-stub')
      .find((w) => w.attributes('icon') === 'mdi-delete') // Attributes are passed to root element of stub if props are defined? NO.
    // Props in stub: props: ['icon'].
    // If props are passed to a component stub, they reside in vm.$props
    // DOM element doesn't necessarily have them as attributes unless we bind them in template.
    // My stub template: <button class="app-btn-stub" @click="$emit('click')"></button>
    // It does NOT bind icon to attribute.
    // So finding by attribute will FAIL.
    // I must find by COMPONENT property or bind it in stub.
    // Let's bind it in stub!

    expect(deleteBtn).toBeUndefined()
  })
})
