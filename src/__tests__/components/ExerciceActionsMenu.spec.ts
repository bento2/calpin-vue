import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExerciceActionsMenu from '@/components/ExerciceActionsMenu.vue'

// Configuration de base pour les tests
const globalStubs = {
  'v-menu': { template: '<div><slot name="activator" :props="{}"/><slot/></div>' },
  'v-btn': true,
  'v-list': { template: '<div><slot/></div>' },
  'v-list-item': {
    template: '<button class="menu-item" @click="$emit(\'click\')"><slot/></button>',
  },
  'v-list-item-title': { template: '<span><slot/></span>' },
  'v-icon': { template: '<div class="v-icon-stub"><slot/></div>' },
}

describe('ExerciceActionsMenu', () => {
  it('émet move-up quand on clique sur monter', async () => {
    const wrapper = mount(ExerciceActionsMenu, {
      props: {
        index: 1,
        isLast: false,
        exerciceId: 'ex1',
      },
      global: { stubs: globalStubs },
    })

    const items = wrapper.findAll('.menu-item')
    // Index > 0 donc "Monter" doit être présent
    const upBtn = items.find((w) => w.text().includes('Monter'))
    expect(upBtn?.exists()).toBe(true)

    await upBtn?.trigger('click')
    expect(wrapper.emitted('move-up')).toBeTruthy()
    expect(wrapper.emitted('move-up')![0]).toEqual([1])
  })

  it('émet move-down quand on clique sur descendre', async () => {
    const wrapper = mount(ExerciceActionsMenu, {
      props: {
        index: 0,
        isLast: false,
        exerciceId: 'ex1',
      },
      global: { stubs: globalStubs },
    })

    const items = wrapper.findAll('.menu-item')
    // !isLast donc "Descendre" doit être présent
    const downBtn = items.find((w) => w.text().includes('Descendre'))
    expect(downBtn?.exists()).toBe(true)

    await downBtn?.trigger('click')
    expect(wrapper.emitted('move-down')).toBeTruthy()
    expect(wrapper.emitted('move-down')![0]).toEqual([0])
  })

  it('émet remove quand on clique sur supprimer', async () => {
    const wrapper = mount(ExerciceActionsMenu, {
      props: {
        index: 0,
        isLast: true,
        exerciceId: 'ex1',
      },
      global: { stubs: globalStubs },
    })

    const items = wrapper.findAll('.menu-item')
    const removeBtn = items.find((w) => w.text().includes('Supprimer'))
    expect(removeBtn?.exists()).toBe(true)

    await removeBtn?.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')![0]).toEqual(['ex1'])
  })

  it('masque monter si index est 0', () => {
    const wrapper = mount(ExerciceActionsMenu, {
      props: {
        index: 0,
        isLast: false,
        exerciceId: 'ex1',
      },
      global: { stubs: globalStubs },
    })

    const items = wrapper.findAll('.menu-item')
    const upBtn = items.find((w) => w.text().includes('Monter'))
    expect(upBtn).toBeUndefined()
  })

  it('masque descendre si isLast est true', () => {
    const wrapper = mount(ExerciceActionsMenu, {
      props: {
        index: 1,
        isLast: true,
        exerciceId: 'ex1',
      },
      global: { stubs: globalStubs },
    })

    const items = wrapper.findAll('.menu-item')
    const downBtn = items.find((w) => w.text().includes('Descendre'))
    expect(downBtn).toBeUndefined()
  })
})
