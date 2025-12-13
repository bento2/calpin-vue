import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InputNumberSerie from '@/components/InputNumberSerie.vue'

describe('InputNumberSerie.vue', () => {
  it('affiche le composant correctement', () => {
    const wrapper = mount(InputNumberSerie, {
      props: {
        modelValue: 10,
        unit: 'KG',
      },
      global: {
        stubs: {
          'v-number-input': {
            template:
              '<input class="v-number-input-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @focus="$emit(\'focus\')" @focusout="$emit(\'focusout\', $event)" />',
            props: ['modelValue', 'placeholder'],
          },
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('KG')
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('émet focusout', async () => {
    const wrapper = mount(InputNumberSerie, {
      props: { modelValue: 10, unit: 'KG' },
      global: {
        stubs: {
          'v-number-input': { template: '<input @focusout="$emit(\'focusout\', $event)" />' },
        },
      },
    })

    await wrapper.find('input').trigger('focusout')
    expect(wrapper.emitted('focusout')).toBeTruthy()
  })

  it('efface la valeur au focus si elle est 0', async () => {
    const wrapper = mount(InputNumberSerie, {
      props: { modelValue: 0, unit: 'KG' },
      global: {
        stubs: {
          'v-number-input': {
            template: '<input @focus="$emit(\'focus\')" :value="modelValue" />',
            props: ['modelValue'],
          },
        },
      },
    })

    await wrapper.find('input').trigger('focus')
    // Le composant met à jour la valeur locale (displayValue) via set
    // Mais ici la prop modelValue est reactively updated?
    // Attends, onFocus fait value.value = null où value est defineModel.
    // Donc ça devrait émettre update:modelValue null.
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it("ne change pas la valeur au focus si elle n'est pas 0", async () => {
    const wrapper = mount(InputNumberSerie, {
      props: { modelValue: 5, unit: 'KG' },
      global: { stubs: { 'v-number-input': { template: '<input @focus="$emit(\'focus\')" />' } } },
    })

    await wrapper.find('input').trigger('focus')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
