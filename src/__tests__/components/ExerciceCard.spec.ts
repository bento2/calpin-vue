import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ExerciceCard from '@/components/ExerciceCard.vue'
import type { Exercice } from '@/types/ExerciceSchema.ts'

const exerciceMock: Exercice = {
  id: '1',
  name: 'Pompes',
  icon: '/icons/push-up.png',
  difficulty: 'débutant',
  hasEquipment: false,
}

const exerciceMockWithEquipment: Exercice = {
  id: '1',
  name: 'Pompes',
  icon: '/icons/push-up.png',
  difficulty: 'débutant',
  hasEquipment: true,
  equipment: ' haltères',
}

describe('ExerciceCard', () => {
  it('Render ExerciceCard', () => {
    const wrapper = mount(ExerciceCard, {
      props: {
        exercice: exerciceMock,
      },
    })
    expect(wrapper.text()).toContain(exerciceMock.name)
  })

  it('Check snapshot', () => {
    const wrapper = mount(ExerciceCard, {
      props: {
        exercice: exerciceMock,
      },
      global: { stubs: { 'n-image': true } },
    })

    // Snapshot test
    expect(wrapper.html()).toMatchSnapshot()
  })
})

describe('ExerciceCard with equipment', () => {
  it('Render ExerciceCard', () => {
    const wrapper = mount(ExerciceCard, {
      props: {
        exercice: exerciceMockWithEquipment,
      },
    })
    expect(wrapper.text()).toContain(exerciceMockWithEquipment.name)
    expect(wrapper.text()).toContain(exerciceMockWithEquipment.equipment)
  })

  it('Check snapshot', () => {
    const wrapper = mount(ExerciceCard, {
      props: {
        exercice: exerciceMock,
      },
      global: { stubs: { 'n-image': true } },
    })

    // Snapshot test
    expect(wrapper.html()).toMatchSnapshot()
  })
})
