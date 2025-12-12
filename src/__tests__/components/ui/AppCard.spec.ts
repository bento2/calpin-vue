import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCard from '@/components/ui/AppCard.vue'

describe('AppCard.vue', () => {
  it('renders default slot', () => {
    const wrapper = mount(AppCard, {
      slots: {
        default: 'Card Content',
      },
      global: {
        stubs: {
          'v-card': { template: '<div><slot /><slot name="title" /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Card Content')
  })

  it('renders title from prop', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'My Title' },
    })
    expect(wrapper.text()).toContain('My Title')
  })

  it('renders title from slot', () => {
    const wrapper = mount(AppCard, {
      slots: { title: 'Slot Title' },
    })
    expect(wrapper.text()).toContain('Slot Title')
  })

  it('renders subtitle from prop', () => {
    const wrapper = mount(AppCard, {
      props: { subtitle: 'My Subtitle' },
    })
    expect(wrapper.text()).toContain('My Subtitle')
  })

  it('renders subtitle from slot', () => {
    const wrapper = mount(AppCard, {
      slots: { subtitle: 'Slot Subtitle' },
    })
    expect(wrapper.text()).toContain('Slot Subtitle')
  })

  it('renders header actions slot', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'Test Title' },
      slots: { headerActions: '<button>Action</button>' },
    })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Action')
  })

  it('renders actions slot', () => {
    const wrapper = mount(AppCard, {
      slots: { actions: '<button>Bottom Action</button>' },
    })
    // Simulate v-if="$slots.actions" being true
    expect(wrapper.text()).toContain('Bottom Action')
  })

  it('passes props to v-card', () => {
    const wrapper = mount(AppCard, {
      props: {
        color: 'primary',
        elevation: 10,
        loading: true,
      },
    })
    const card = wrapper.findComponent({ name: 'v-card' })
    expect(card.props('color')).toBe('primary')
    expect(card.props('elevation')).toBe(10)
    expect(card.props('loading')).toBe(true)
  })

  it('applies specific classes when title is present', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'Has Title' },
    })
    const text = wrapper.findComponent({ name: 'v-card-text' })
    expect(text.classes()).toContain('pt-0')
  })
})
