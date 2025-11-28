import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InputNumberSerie from '@/components/InputNumberSerie.vue'

describe('InputNumberSerie', () => {
  it('renders component', () => {
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

  it('displays the correct unit', () => {
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
