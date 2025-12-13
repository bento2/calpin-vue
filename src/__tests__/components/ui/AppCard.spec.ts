import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCard from '@/components/ui/AppCard.vue'

describe('AppCard.vue', () => {
  it('affiche le slot par défaut', () => {
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

  it('affiche le titre depuis la prop', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'My Title' },
    })
    expect(wrapper.text()).toContain('My Title')
  })

  it('affiche le titre depuis le slot', () => {
    const wrapper = mount(AppCard, {
      slots: { title: 'Slot Title' },
    })
    expect(wrapper.text()).toContain('Slot Title')
  })

  it('affiche le sous-titre depuis la prop', () => {
    const wrapper = mount(AppCard, {
      props: { subtitle: 'My Subtitle' },
    })
    expect(wrapper.text()).toContain('My Subtitle')
  })

  it('affiche le sous-titre depuis le slot', () => {
    const wrapper = mount(AppCard, {
      slots: { subtitle: 'Slot Subtitle' },
    })
    expect(wrapper.text()).toContain('Slot Subtitle')
  })

  it('affiche le slot header actions', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'Test Title' },
      slots: { headerActions: '<button>Action</button>' },
    })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Action')
  })

  it('affiche le slot actions', () => {
    const wrapper = mount(AppCard, {
      slots: { actions: '<button>Bottom Action</button>' },
    })
    // Simule v-if="$slots.actions" à true
    expect(wrapper.text()).toContain('Bottom Action')
  })

  it('passe les props à v-card', () => {
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

  it('applique des classes spécifiques quand le titre est présent', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'Has Title' },
    })
    const text = wrapper.findComponent({ name: 'v-card-text' })
    expect(text.classes()).toContain('pt-0')
  })
})
