import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InputNumberSerie from '@/components/InputNumberSerie.vue'

describe('InputNumberSerie', () => {
  it('affiche le composant', () => {
    const wrapper = mount(InputNumberSerie, {
      props: {
        unit: 'kg',
      },
      global: {
        stubs: {
          'v-number-input': {
            template: '<div class="v-number-input-stub"></div>',
          },
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("affiche l'unité correcte", () => {
    const wrapper = mount(InputNumberSerie, {
      props: {
        unit: 'reps',
      },
      global: {
        stubs: {
          'v-number-input': {
            template: '<div class="v-number-input-stub"></div>',
          },
        },
      },
    })
    expect(wrapper.html()).toContain('reps')
  })
})
