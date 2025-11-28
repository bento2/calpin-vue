import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import Exercices from '@/components/ExercicesCard.vue'
import ExerciceCard from '@/components/ExerciceCard.vue'
import type { Exercice } from '@/types/ExerciceSchema.ts'

// Mock the ExerciceUtils
vi.mock('@/services/ExerciceUtils.ts', () => {
  const mockExercices: Exercice[] = [
    {
      id: '1',
      name: 'Pompes',
      icon: '/icons/push-up.png',
      difficulty: 'débutant',
      hasEquipment: false,
    },
    {
      id: '2',
      name: 'Squats',
      icon: '/icons/squat.png',
      difficulty: 'débutant',
      hasEquipment: false,
    },
    {
      id: '3',
      name: 'Gainage',
      icon: '/icons/plank.png',
      difficulty: 'intermédiaire',
      hasEquipment: false,
    },
  ]

  return {
    ExerciceUtils: {
      getInstance: vi.fn(() => ({
        find: vi.fn(({ page = 0, filter = '' } = {}) => {
          // Simple pagination - return 2 items per page
          const start = page * 2
          const filtered = mockExercices.filter((ex) =>
            ex.name.toLowerCase().includes(filter.toLowerCase()),
          )
          return filtered.slice(start, start + 2)
        }),
      })),
    },
  }
})

describe('Exercices Component', () => {
  const createWrapper = (props = {}) => {
    return mount(Exercices, {
      props: {
        selectable: false,
        selected: [],
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
        ],
        stubs: {
          'v-infinite-scroll': {
            template: '<div><slot :done="() => {}" /></div>',
          },
          'v-text-field': true,
          'v-icon': true,
          'v-row': true,
          'v-col': true,
          'v-container': true,
          'v-card': true,
          'v-card-text': true,
          'v-card-actions': true,
          'v-btn': true,
          'v-dialog': true,
          'v-toolbar': true,
          'v-toolbar-title': true,
          'v-divider': true,
          'v-card-title': true,
          'v-card-subtitle': true,
          'v-spacer': true,
          'v-checkbox': true,
        },
      },
    })
  }

  it('renders the component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('loads exercices on mount', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const exerciceCards = wrapper.findAllComponents(ExerciceCard)
    expect(exerciceCards.length).toBe(2) // First page has 2 items
  })

  it('filters exercices when search term changes', async () => {
    const wrapper = createWrapper()
    await nextTick()

    // Set filter
    const searchInput = wrapper.findComponent({ name: 'v-text-field' })
    await searchInput.vm.$emit('update:modelValue', 'pompes')

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 300))

    const exerciceCards = wrapper.findAllComponents(ExerciceCard)
    expect(exerciceCards.length).toBe(2)
    expect(exerciceCards[0].props('exercice').name).toBe('Pompes')
  })

  /**it('emits update:selected when an exercice is selected in selectable mode', async () => {
    const wrapper = createWrapper({ selectable: true })
    await nextTick()

    // Find the checkbox component stub
    const checkbox = wrapper.findComponent({ name: 'v-checkbox' })
    await checkbox.vm.$emit('update:modelValue', true)

    expect(wrapper.emitted('update:selected')).toBeTruthy()
  })**/
})
