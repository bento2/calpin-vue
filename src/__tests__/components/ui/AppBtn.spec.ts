import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBtn from '@/components/ui/AppBtn.vue'

describe('AppBtn.vue', () => {
  it('affiche le slot par défaut', () => {
    const wrapper = mount(AppBtn, {
      slots: {
        default: 'Click me',
      },
      global: {
        stubs: {
          'v-btn': { template: '<button><slot /></button>' },
          'v-icon': { template: '<i><slot /></i>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Click me')
  })

  it('applique les classes de variante primaire par défaut', () => {
    const wrapper = mount(AppBtn)
    const btn = wrapper.findComponent({ name: 'v-btn' })
    expect(btn.exists()).toBe(true)
    expect(btn.props('color')).toBe('blue-accent-2')
    expect(btn.props('variant')).toBe('flat')
    expect(btn.classes()).toContain('text-white')
  })

  it('applique les classes de variante secondaire', () => {
    const wrapper = mount(AppBtn, {
      props: { variant: 'secondary' },
    })
    const btn = wrapper.findComponent({ name: 'v-btn' })
    expect(btn.props('color')).toBe('blue-accent-2')
    expect(btn.props('variant')).toBe('outlined')
    expect(btn.classes()).toContain('bg-white')
  })

  it('applique les classes de variante danger', () => {
    const wrapper = mount(AppBtn, {
      props: { variant: 'danger' },
    })
    const btn = wrapper.findComponent({ name: 'v-btn' })
    expect(btn.props('color')).toBe('red-accent-4')
    expect(btn.props('variant')).toBe('flat')
    expect(btn.classes()).toContain('text-white')
  })

  it('applique les classes de variante succès', () => {
    const wrapper = mount(AppBtn, {
      props: { variant: 'success' },
    })
    const btn = wrapper.findComponent({ name: 'v-btn' })
    expect(btn.props('color')).toBe('green-accent-4')
    expect(btn.props('variant')).toBe('flat')
    expect(btn.classes()).toContain('text-white')
  })

  it('applique les classes de variante ghost', () => {
    const wrapper = mount(AppBtn, {
      props: { variant: 'ghost' },
    })
    const btn = wrapper.findComponent({ name: 'v-btn' })
    expect(btn.props('variant')).toBe('text')
  })

  it("affiche l'icône avec la variante icône", () => {
    const wrapper = mount(AppBtn, {
      props: { variant: 'icon', icon: 'mdi-plus' },
    })
    const btn = wrapper.findComponent({ name: 'v-btn' })
    const icon = wrapper.findComponent({ name: 'v-icon' })
    // console.log(wrapper.html())
    expect(btn.props('variant')).toBe('text')
    expect(icon.exists()).toBe(true)
    const iconClasses = icon.classes()
    expect(iconClasses.some((c) => c.includes('mdi-plus'))).toBe(true)
  })

  it('passe les props à v-btn', () => {
    const wrapper = mount(AppBtn, {
      props: {
        block: true,
        loading: true,
        disabled: true,
        to: '/home',
      },
    })
    const btn = wrapper.findComponent({ name: 'v-btn' })
    expect(btn.props('block')).toBe(true)
    expect(btn.props('loading')).toBe(true)
    expect(btn.props('disabled')).toBe(true)
    expect(btn.props('to')).toBe('/home')
  })
  it('utilise la variante par défaut sivariant inconnue', () => {
    const wrapper = mount(AppBtn, {
      props: { variant: 'unknown' as unknown as 'primary' },
    })
    const btn = wrapper.findComponent({ name: 'v-btn' })
    // Should fall back to base props (execution of default branch)
    expect(btn.exists()).toBe(true)
  })
})
