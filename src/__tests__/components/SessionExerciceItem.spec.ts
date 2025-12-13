import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionExerciceItem from '@/components/SessionExerciceItem.vue'
import { type ExerciceSeries } from '@/types/ExerciceSeriesSchema'
import ExerciceActionsMenu from '@/components/ExerciceActionsMenu.vue'

// Mock ExerciceCard car c'est un enfant
vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    template: '<div class="exercice-card-stub"><slot name="subtitle"/><slot name="actions"/></div>',
    props: ['exercice'],
  },
}))

// Mock ExerciceActionsMenu pour éviter de tester sa logique interne ici
vi.mock('@/components/ExerciceActionsMenu.vue', () => ({
  default: {
    name: 'ExerciceActionsMenu',
    template:
      '<div class="exercice-actions-menu-stub" @click="$emit(\'remove\', exerciceId)"></div>', // Simple stub pour déclencher un event
    props: ['index', 'isLast', 'exerciceId'],
  },
}))

describe('SessionExerciceItem', () => {
  const mockExercice = {
    id: 'e1',
    name: 'Ex1',
    series: [{}, {}],
    nbChecked: 1,
  } as unknown as ExerciceSeries

  const createWrapper = (props = {}) => {
    return mount(SessionExerciceItem, {
      props: {
        exercice: mockExercice,
        index: 0,
        isOpen: false,
        isLast: false,
        ...props,
      },
      global: {
        stubs: {
          'v-chip': { template: '<div class="v-chip-stub"><slot/></div>' },
          'v-btn': true,
          'v-icon': true,
        },
      },
    })
  }

  it('affiche correctement les props et computed', () => {
    // Cas 1: Pas terminé
    let wrapper = createWrapper()

    expect(wrapper.text()).toContain('1 / 2 séries')
    const chip = wrapper.find('.v-chip-stub')
    expect(chip.attributes('color')).toBe('white')

    // Cas 2: Terminé
    const completedEx = { ...mockExercice, nbChecked: 2 }
    wrapper = createWrapper({ exercice: completedEx })

    const chip2 = wrapper.find('.v-chip-stub')
    expect(chip2.attributes('color')).toBe('success')

    // Cas 3: Valeurs manquantes (coverage pour ?? 0)
    const emptyEx = {
      id: 'e2',
      name: 'Ex2',
    } as unknown as ExerciceSeries

    wrapper = createWrapper({ exercice: emptyEx })
    expect(wrapper.text()).toContain('0 / 0 séries')
  })

  it("passe les bonnes props au menu d'actions", () => {
    const wrapper = createWrapper({ index: 1, isLast: true })
    const menuStub = wrapper.findComponent(ExerciceActionsMenu)

    expect(menuStub.exists()).toBe(true)
    expect(menuStub.props('index')).toBe(1)
    expect(menuStub.props('isLast')).toBe(true)
    expect(menuStub.props('exerciceId')).toBe('e1')
  })

  it('relais les événements du menu', async () => {
    const wrapper = createWrapper()
    const menuStub = wrapper.findComponent(ExerciceActionsMenu)

    // Test remove
    await menuStub.vm.$emit('remove', 'e1')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')![0]).toEqual(['e1'])

    // Test move-up
    await menuStub.vm.$emit('move-up', 0)
    expect(wrapper.emitted('move-up')).toBeTruthy()
    expect(wrapper.emitted('move-up')![0]).toEqual([0])

    // Test move-down
    await menuStub.vm.$emit('move-down', 0)
    expect(wrapper.emitted('move-down')).toBeTruthy()
    expect(wrapper.emitted('move-down')![0]).toEqual([0])
  })

  it('reflète la prop isOpen sur le bouton toggle', () => {
    const wrapper = createWrapper({ isOpen: true })

    // Trouve le bouton toggle (celui avec le chevron)
    const btns = wrapper.findAllComponents({ name: 'v-btn' })
    const toggleBtn = btns.find((btn) => btn.attributes('icon') === 'mdi-chevron-up')

    expect(toggleBtn).toBeDefined()
    expect(toggleBtn?.attributes('title')).toBe('Fermer')

    // Vérifie le cas inverse
    const wrapperClosed = createWrapper({ isOpen: false })
    const btnsClosed = wrapperClosed.findAllComponents({ name: 'v-btn' })
    const toggleBtnClosed = btnsClosed.find((btn) => btn.attributes('icon') === 'mdi-chevron-down')

    expect(toggleBtnClosed).toBeDefined()
    expect(toggleBtnClosed?.attributes('title')).toBe('Ouvrir')
  })

  it("émet l'événement toggle", async () => {
    const wrapper = createWrapper()

    // On simule le clic directement sur le stub du v-btn si on peut le trouver facilement
    // Mais ici v-btn est stubbé à "true".
    // On va utiliser findComponent pour déclencher le click

    const btns = wrapper.findAllComponents({ name: 'v-btn' })
    // Le bouton toggle est le deuxième bouton dans le template après le menu ? Non il est après le menu.
    // Le menu est stubbé.
    // Dans le template:
    /*
      <ExerciceActionsMenu ... />
      <v-btn ... @click="emit('toggle')" />
    */
    // Donc il y a 1 v-btn (le toggle). ExerciceActionsMenu contient aussi des v-btn mais il est stubbé en shallow.

    expect(btns.length).toBe(1)
    await btns[0].trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')![0]).toEqual([0])
  })
})
