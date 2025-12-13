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

// Mock du router
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
            name: 'AppBtn', // Facilite findComponent
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

    // Utiliser le sélecteur de classe correspondant au template du stub
    const deleteBtn = wrapper
      .findAll('.app-btn-stub')
      .find((w) => w.attributes('icon') === 'mdi-delete')
    // Les props dans le stub : props: ['icon'].
    // Si des props sont passées à un stub de composant, elles résident dans vm.$props
    // L'élément DOM ne les a pas nécessairement comme attributs à moins qu'on ne les lie dans le template.
    // Mon template de stub : <button class="app-btn-stub" @click="$emit('click')"></button>
    // Il ne lie PAS l'icône à l'attribut.
    // Donc trouver par attribut ÉCHOUERAIT.
    // Je dois trouver par propriété du COMPOSANT ou le lier dans le stub.
    // Lions-le dans le stub !

    expect(deleteBtn).toBeUndefined()
  })
})
