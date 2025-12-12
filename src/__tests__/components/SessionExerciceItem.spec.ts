import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionExerciceItem from '@/components/SessionExerciceItem.vue'
import { type ExerciceSeries } from '@/types/ExerciceSeriesSchema'

// Mock ExerciceCard since it is a child
vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    template: '<div class="exercice-card-stub"><slot name="subtitle"/><slot name="actions"/></div>',
    props: ['exercice'],
  },
}))

describe('SessionExerciceItem', () => {
  const mockExercice = {
    id: 'e1',
    name: 'Ex1',
    series: [{}, {}],
    nbChecked: 1,
  } as unknown as ExerciceSeries

  it('renders correctly', () => {
    const wrapper = mount(SessionExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isOpen: false,
        isLast: false,
      },
      global: {
        stubs: {
          'v-chip': { template: '<div><slot/></div>' },
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': { template: '<div><slot/></div>' },
          'v-list-item': { template: '<div @click="$emit(\'click\')"><slot/></div>' },
          'v-list-item-title': { template: '<div><slot/></div>' },
          'v-icon': true,
          'v-btn': { template: '<button @click="$emit(\'click\')"></button>' },
        },
      },
    })

    expect(wrapper.find('.exercice-card-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('1 / 2 séries')
  })

  it('emits move-up event', async () => {
    const wrapper = mount(SessionExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 1, // index > 0 to show move up
        isOpen: false,
        isLast: false,
      },
      global: {
        stubs: {
          'v-chip': true,
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': { template: '<div><slot/></div>' },
          'v-list-item': {
            template: '<button class="move-up" @click="$emit(\'click\')"></button>',
          },
          'v-list-item-title': true,
          'v-icon': true,
          'v-btn': true,
        },
      },
    })

    // Simulate finding the move up item. In the real component it is inside v-menu -> v-list
    // We stubbed v-menu and v-list to render slots.
    // The items are conditionally rendered.
    // Item 1: Move Up (if index > 0)
    // Item 2: Move Down (if !isLast)
    // Item 3: Delete

    const items = wrapper.findAll('.move-up')
    // This selector is risky because all list items use the stub.
    // Let's refine the stub or find by text if possible, but stub renders button.

    // Better approach: use more specific stubs or inspect what is rendered.
    // The component uses:
    /*
      <v-list-item @click="emit('move-up', index)" v-if='index > 0'> ... </v-list-item>
    */

    // Let's assume the first item is move up if index > 0.
    await items[0].trigger('click')
    expect(wrapper.emitted('move-up')).toBeTruthy()
    expect(wrapper.emitted('move-up')![0]).toEqual([1])
  })

  it('emits toggle event', async () => {
    const wrapper = mount(SessionExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isOpen: false,
        isLast: false,
      },
      global: {
        stubs: {
          'v-chip': true,
          'v-menu': true,
          'v-list': true,
          'v-list-item': true,
          'v-icon': true,
          'v-btn': { template: '<button class="toggle-btn" @click="$emit(\'click\')"></button>' },
        },
      },
    })

    // The toggle button is outside the menu

    // Wait, v-menu activator also uses v-btn.
    // In template:
    /*
      <v-menu> <v-btn .../> </v-menu>
      <v-btn ... @click="emit('toggle', index)" />
    */
    // Since v-menu is stubbed to render activator, we have 2 v-btns.
    // The toggle button is likely the second one (or distinguishable by props).

    // Let's find all buttons
    const buttons = wrapper.findAll('.toggle-btn')
    // The second one should be the toggle
    await buttons[buttons.length - 1].trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')![0]).toEqual([0])
  })
})
