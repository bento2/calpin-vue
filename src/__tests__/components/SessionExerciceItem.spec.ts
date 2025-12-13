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

  it('renders correctly props and computed', () => {
    // Case 1: Not completed
    let wrapper = mount(SessionExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isOpen: false,
        isLast: false,
      },
      global: {
        stubs: {
          'v-chip': { template: '<div class="v-chip-stub"><slot/></div>' },
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': true,
          'v-list-item': true,
          'v-btn': true,
          'v-icon': true,
        },
      },
    })

    expect(wrapper.text()).toContain('1 / 2 séries')
    const chip = wrapper.find('.v-chip-stub')
    expect(chip.attributes('color')).toBe('white')

    // Case 2: Completed
    const completedEx = { ...mockExercice, nbChecked: 2 }
    wrapper = mount(SessionExerciceItem, {
      props: {
        exercice: completedEx,
        index: 0,
        isOpen: false,
        isLast: false,
      },
      global: {
        stubs: {
          'v-chip': { template: '<div class="v-chip-stub"><slot/></div>' },
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': true,
          'v-list-item': true,
          'v-btn': true,
          'v-icon': true,
        },
      },
    })

    const chip2 = wrapper.find('.v-chip-stub')
    expect(chip2.attributes('color')).toBe('success')
  })

  it('handles conditional menu actions', async () => {
    // Index 0, isLast = false -> No Move Up, Yes Move Down, Yes Remove
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
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': { template: '<div><slot/></div>' },
          'v-list-item': {
            template: '<button class="menu-item" @click="$emit(\'click\')"><slot/></button>',
          },
          'v-list-item-title': { template: '<span><slot/></span>' },
          'v-btn': true,
          'v-icon': true,
        },
      },
    })

    const menuItems = wrapper.findAll('.menu-item')
    // Expected: Move Down, Remove (2 items)
    // Texts: Descendre, Supprimer
    // Move Up should be absent
    const texts = menuItems.map((w) => w.text())
    expect(texts).not.toContain('Monter')
    expect(texts).toContain('Déscendre')
    expect(texts).toContain('Supprimer')

    // Test emit Move Down
    const downBtn = menuItems.find((w) => w.text().includes('Déscendre'))
    await downBtn?.trigger('click')
    expect(wrapper.emitted('move-down')![0]).toEqual([0])

    // Test emit Remove
    const removeBtn = menuItems.find((w) => w.text().includes('Supprimer'))
    await removeBtn?.trigger('click')
    expect(wrapper.emitted('remove')![0]).toEqual(['e1'])
  })

  it('handles move up availability', async () => {
    // Index 1 -> Move Up Available
    const wrapper = mount(SessionExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 1,
        isOpen: false,
        isLast: false,
      },
      global: {
        stubs: {
          'v-chip': true,
          'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
          'v-list': { template: '<div><slot/></div>' },
          'v-list-item': { template: '<button class="menu-item"><slot/></button>' },
          'v-list-item-title': { template: '<span><slot/></span>' },
          'v-btn': true,
          'v-icon': true,
        },
      },
    })
    const texts = wrapper.findAll('.menu-item').map((w) => w.text())
    expect(texts).toContain('Monter')

    // Trigger move up
    const upBtn = wrapper.findAll('.menu-item').find((w) => w.text().includes('Monter'))
    expect(upBtn?.exists()).toBe(true)
    await upBtn?.trigger('click')

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
          'v-menu': true, // Stub v-menu away to focus on toggle button
          'v-btn': { template: '<button class="toggle-btn" @click="$emit(\'click\')"></button>' },
          'v-list': true,
          'v-list-item': true,
          'v-icon': true,
        },
      },
    })

    const btn = wrapper.find('.toggle-btn')
    await btn.trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')![0]).toEqual([0])
  })
})
