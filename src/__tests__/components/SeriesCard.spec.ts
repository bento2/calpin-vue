import { describe, it, expect, vi, type Mock } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SeriesCard from '@/components/SeriesCard.vue'
import type { Serie } from '@/types/SerieSchema'
import { useSessionStore } from '@/stores/useSessionStore'

describe('Composant SeriesCard', () => {
  const mockSeries: Serie[] = [
    {
      poids: 50,
      repetitions: 10,
      checked: true,
      total: 500,
    },
    {
      poids: 60,
      repetitions: 8,
      checked: false,
      total: 480,
    },
  ]

  it('affiche le composant', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    const store = useSessionStore(pinia)
    ;(store.findStatsExercices as Mock).mockResolvedValue(new Map())

    const wrapper = mount(SeriesCard, {
      props: {
        modelValue: mockSeries,
        exerciceId: '1',
      },
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': {
            template: '<div class="v-card"><slot /></div>',
          },
          'v-checkbox': {
            template: '<input type="checkbox" />',
          },
          'v-btn': {
            template: '<button><slot /></button>',
          },
          InputNumberSerie: {
            template: '<div class="input-number-serie"></div>',
          },
        },
      },
    })

    // Attendre la résolution des promesses
    await wrapper.vm.$nextTick()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.findAll('.v-card')).toHaveLength(2)
  })

  it('ajoute une série au clic sur le bouton ajouter', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useSessionStore(pinia)
    ;(store.findStatsExercices as Mock).mockResolvedValue(new Map())

    const wrapper = mount(SeriesCard, {
      props: { modelValue: [], exerciceId: '1' },
      global: {
        plugins: [pinia],
        stubs: { InputNumberSerie: true, 'v-checkbox': true, 'v-icon': true },
      },
    })

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Ajouter'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    const props = wrapper.props('modelValue')
    expect(props).toHaveLength(1)
    expect(props![0]).toEqual(
      expect.objectContaining({
        poids: 0,
        repetitions: 0,
        checked: false,
        total: 0,
      }),
    )
  })

  it('supprime une série au clic sur le bouton supprimer', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useSessionStore(pinia)
    // Correctif : Mock findStatsExercices
    ;(store.findStatsExercices as Mock).mockResolvedValue(new Map())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = [{ poids: 10, repetitions: 10, checked: false, total: 100 }] as any

    const wrapper = mount(SeriesCard, {
      props: { modelValue: series, exerciceId: '1' },
      global: {
        plugins: [pinia],
        stubs: { InputNumberSerie: true, 'v-checkbox': true, 'v-icon': true },
      },
    })

    // Le bouton delete est le v-btn avec icon="mdi-delete"
    // Avec le stub actuel <button><slot /></button>, il n'a peut-être pas de texte distinctif si slot vide.
    // On va chercher le PREMIER bouton dans la card (il y en a un par serie).
    const deleteBtn = wrapper.find('.v-card button')

    // Pour être sûr, on met un stub mieux fait dans ce test ou on update global stub
    // Mettre à jour l'approche par stub global via surcharge du wrapper ? Non, plus simple de se fier à la structure.
    // L'unique bouton DANS la v-card est le delete. Le bouton AJOUTER est hors v-card.

    await deleteBtn.trigger('click')
    expect(wrapper.props('modelValue')).toHaveLength(0)
  })

  it('auto-coche la série si poids et reps > 0 lors du focusout', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useSessionStore(pinia)
    ;(store.findStatsExercices as Mock).mockResolvedValue(new Map())

    const series = [{ poids: 10, repetitions: 0, checked: false, total: 0 }]

    const wrapper = mount(SeriesCard, {
      props: { modelValue: series, exerciceId: '1' },
      global: {
        plugins: [pinia],
        stubs: {
          InputNumberSerie: {
            template: '<input class="input-number-stub" @focusout="$emit(\'focusout\')" />',
            props: ['modelValue'],
          },
          'v-checkbox': {
            template: '<input type="checkbox" v-model="modelValue" />',
            props: ['modelValue'],
          },
        },
      },
    })

    series[0].repetitions = 10
    // Recherche par classe ajoutée au template du stub pour être sûr
    const inputs = wrapper.findAll('.input-number-stub')
    await inputs[1].trigger('focusout')

    expect(series[0].checked).toBe(true)
  })

  it('pré-remplit avec la dernière série si disponible lors du check', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useSessionStore(pinia)
    const lastSerie = { poids: 50, repetitions: 12, checked: true }
    const stats = new Map()
    stats.set('1', lastSerie)
    ;(store.findStatsExercices as Mock).mockResolvedValue(stats)

    const series = [{ poids: 0, repetitions: 0, checked: false }]
    const wrapper = mount(SeriesCard, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: { modelValue: series as any, exerciceId: '1' },
      global: {
        plugins: [pinia],
        stubs: {
          InputNumberSerie: true,
          'v-checkbox': {
            template: '<input type="checkbox" class="checkbox-stub" @change="$emit(\'change\')" />',
          },
        },
      },
    })

    await wrapper.vm.$nextTick() // attendre le onMounted

    const checkbox = wrapper.find('.checkbox-stub')
    await checkbox.trigger('change')

    expect(series[0].poids).toBe(50)
    expect(series[0].repetitions).toBe(12)
  })
  it("initialise le tableau si vide lors de l'ajout", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useSessionStore(pinia)
    ;(store.findStatsExercices as Mock).mockResolvedValue(new Map())

    const wrapper = mount(SeriesCard, {
      props: { modelValue: undefined, exerciceId: '1' }, // Test undefined
      global: { plugins: [pinia] },
    })

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Ajouter'))
    await addBtn!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    // First emit should be the new array with 1 item
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(1)
  })

  it('bind correctement les placeholders (couverture lignes 69-71, 74)', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useSessionStore(pinia)
    const lastStats = { poids: 42, repetitions: 12, checked: true }
    const statsMap = new Map()
    statsMap.set('1', lastStats)

    // Mock return
    ;(store.findStatsExercices as Mock).mockResolvedValue(statsMap)

    const wrapper = mount(SeriesCard, {
      props: { modelValue: [{ poids: 0, repetitions: 0, total: 0 }], exerciceId: '1' },
      global: {
        plugins: [pinia],
        stubs: {
          InputNumberSerie: {
            template: '<div class="input-stub" :data-placeholder="placeholder"></div>',
            props: ['placeholder', 'modelValue', 'unit'],
          },
        },
      },
    })

    await flushPromises() // Wait for computed/mounted promise

    const inputs = wrapper.findAll('.input-stub')
    expect(inputs.length).toBe(2)

    // Check placeholder props
    expect(inputs[0].attributes('data-placeholder')).toBe('42')
    expect(inputs[1].attributes('data-placeholder')).toBe('12')
  })
})
