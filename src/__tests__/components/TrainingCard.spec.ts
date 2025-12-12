import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrainingCard from '@/components/TrainingCard.vue'
import type { Training } from '@/types/TrainingSchema'
import type { Exercice } from '@/types/ExerciceSchema'

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

  const createWrapper = (props = {}) => {
    return mount(TrainingCard, {
      props: {
        training: mockTraining,
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        stubs: {
          'v-card': {
            template: '<div class="v-card"><slot /></div>',
          },
          'v-card-title': {
            template: '<div class="v-card-title"><slot /></div>',
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot /></div>',
          },
          'v-btn': {
            template: '<button><slot /></button>',
            props: ['icon'],
          },
          ExerciceIcon: {
            template: '<div class="exercice-icon"></div>',
          },
        },
        mocks: {
          $router: {
            push: vi.fn(),
          },
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
    })
    expect(wrapper.html()).toContain("n'existe pas")
  })
})
