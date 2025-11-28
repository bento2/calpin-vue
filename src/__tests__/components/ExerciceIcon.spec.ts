import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExerciceIcon from '@/components/ExerciceIcon.vue'
import type { Exercice } from '@/types/ExerciceSchema.ts'

describe('ExerciceIcon', () => {
  const mockExercice: Exercice = {
    id: '1',
    name: 'Pompes',
    icon: '/icons/push-up.png',
    difficulty: 'débutant',
    hasEquipment: false,
  }

  it('renders with exercice prop', () => {
    const wrapper = mount(ExerciceIcon, {
      props: {
        exercice: mockExercice,
      },
      global: {
        stubs: {
          'v-avatar': {
            template: '<div class="v-avatar-stub"><slot /></div>',
          },
          'v-img': {
            template: '<img />',
            props: ['src', 'alt'],
          },
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
