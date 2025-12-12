import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrainingExerciceItem from '@/components/TrainingExerciceItem.vue'
import { type Exercice } from '@/types/ExerciceSchema'

vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    template: '<div class="exercice-card-stub"><slot name="actions"/></div>',
    props: ['exercice'],
  },
}))

describe('TrainingExerciceItem', () => {
  const mockExercice = {
    id: 'e1',
    name: 'Ex1',
  } as unknown as Exercice

  it('renders correctly', () => {
    const wrapper = mount(TrainingExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isLast: false,
      },
      global: {
        stubs: {
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': { template: '<div><slot/></div>' },
          'v-list-item': {
            template: '<div class="list-item" @click="$emit(\'click\')"><slot/></div>',
          },
          'v-list-item-title': true,
          'v-icon': true,
          'v-btn': { template: '<button></button>' },
        },
      },
    })

    expect(wrapper.find('.exercice-card-stub').exists()).toBe(true)
  })

  it('emits remove event', async () => {
    const wrapper = mount(TrainingExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isLast: true,
      },
      global: {
        stubs: {
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': { template: '<div><slot/></div>' },
          'v-list-item': {
            template: '<div class="list-item" @click="$emit(\'click\')"><slot/></div>',
          }, // Stub list item to be clickable
          'v-list-item-title': true,
          'v-icon': true,
          'v-btn': true,
        },
      },
    })

    // Menu items:
    // 1. Move Up (if index > 0) -> Not present (index=0)
    // 2. Move Down (if !isLast) -> Not present (isLast=true)
    // 3. Remove -> Present

    const items = wrapper.findAll('.list-item')
    expect(items.length).toBe(1)

    await items[0].trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')![0]).toEqual(['e1'])
  })
})
