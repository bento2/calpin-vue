import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrainingExerciceItem from '@/components/TrainingExerciceItem.vue'
import { type Exercice } from '@/types/ExerciceSchema'
import ExerciceActionsMenu from '@/components/ExerciceActionsMenu.vue'

vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    template: '<div class="exercice-card-stub"><slot name="actions"/></div>',
    props: ['exercice'],
  },
}))

// Mock ExerciceActionsMenu
vi.mock('@/components/ExerciceActionsMenu.vue', () => ({
  default: {
    name: 'ExerciceActionsMenu',
    template: '<div class="exercice-actions-menu-stub"></div>',
    props: ['index', 'isLast', 'exerciceId'],
  },
}))

describe('TrainingExerciceItem', () => {
  const mockExercice = {
    id: 'e1',
    name: 'Ex1',
  } as unknown as Exercice

  it("s'affiche correctement", () => {
    const wrapper = mount(TrainingExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isLast: false,
      },
      global: {
        stubs: {
          'v-btn': true,
          'v-icon': true,
        },
      },
    })

    expect(wrapper.find('.exercice-card-stub').exists()).toBe(true)
    const menu = wrapper.findComponent(ExerciceActionsMenu)
    expect(menu.exists()).toBe(true)
    expect(menu.props('exerciceId')).toBe('e1')
  })

  it('relais les événements du menu', async () => {
    const wrapper = mount(TrainingExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isLast: true,
      },
      global: {
        stubs: {
          'v-btn': true,
          'v-icon': true,
        },
      },
    })

    const menu = wrapper.findComponent(ExerciceActionsMenu)

    // Test remove
    await menu.vm.$emit('remove', 'e1')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')![0]).toEqual(['e1'])

    // Test move-up
    await menu.vm.$emit('move-up', 0)
    expect(wrapper.emitted('move-up')).toBeTruthy()

    // Test move-down
    await menu.vm.$emit('move-down', 0)
    expect(wrapper.emitted('move-down')).toBeTruthy()
  })
})
