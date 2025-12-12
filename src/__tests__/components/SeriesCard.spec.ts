import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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
    // @ts-expect-error - vitest mock method
    store.findStatsExercices.mockResolvedValue(new Map())

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
  })
})
