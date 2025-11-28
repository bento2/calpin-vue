import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionCard from '@/components/SessionCard.vue'
import type { Session } from '@/types/SessionSchema.ts'

describe('SessionCard', () => {
  const mockSession: Session = {
    id: 'session-1',
    name: 'Session du matin',
    nbChecked: 5,
    total: 250,
    exercices: [],
    ctime: new Date(),
    mtime: new Date(),
  }

  it('renders the session name', () => {
    const wrapper = mount(SessionCard, {
      props: {
        modelValue: mockSession,
      },
      global: {
        stubs: {
          'v-card': {
            template: '<div class="v-card"><slot /></div>',
          },
          'v-card-title': {
            template: '<div class="v-card-title"><slot /></div>',
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot /></div>',
          },
        },
      },
    })
    expect(wrapper.html()).toContain('Session du matin')
  })
})
