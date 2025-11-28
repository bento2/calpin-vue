import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SeriesCard from '@/components/SeriesCard.vue'
import type { Serie } from '@/types/SerieSchema.ts'

describe('SeriesCard', () => {
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

  it('renders component', () => {
    const wrapper = mount(SeriesCard, {
      props: {
        modelValue: mockSeries,
      },
      global: {
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
    expect(wrapper.exists()).toBe(true)
  })
})
