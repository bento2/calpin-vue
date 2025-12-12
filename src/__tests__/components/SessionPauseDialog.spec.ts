import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionPauseDialog from '@/components/SessionPauseDialog.vue'
import type { Session } from '@/types/SessionSchema'

describe('SessionPauseDialog.vue', () => {
  const mockSession: Session = {
    id: 's1',
    trainingId: 't1',
    dateDebut: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    status: 'en_cours',
    exercices: [],
    // Properties from transform (simulated for test since we pass object directly)
    ended: false,
    nbChecked: 0,
    total: 0,
  }

  it('affiche le dialogue lorsque modelValue est true', () => {
    const wrapper = mount(SessionPauseDialog, {
      props: {
        modelValue: true,
        session: mockSession,
      },
      global: {
        stubs: {
          'v-dialog': {
            template: '<div class="v-dialog-stub" v-if="modelValue"><slot /></div>',
            props: ['modelValue'],
          },
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          AppBtn: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        },
      },
    })

    expect(wrapper.find('.v-dialog-stub').exists()).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('émet les événements appropriés au clic sur les boutons', async () => {
    const wrapper = mount(SessionPauseDialog, {
      props: {
        modelValue: true,
        session: mockSession,
      },
      global: {
        stubs: {
          'v-dialog': { template: '<div><slot /></div>', props: ['modelValue'] },
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          AppBtn: {
            template: '<button class="app-btn-stub" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    })

    const buttons = wrapper.findAll('.app-btn-stub')
    const findBtn = (text: string) => buttons.find((b) => b.text().includes(text))

    const btnRestart = findBtn('Recommencer')
    expect(btnRestart).toBeDefined()
    await btnRestart?.trigger('click')
    expect(wrapper.emitted('restart')).toBeTruthy()

    const btnEnd = findBtn('Terminer et enregistrer')
    expect(btnEnd).toBeDefined()
    await btnEnd?.trigger('click')
    expect(wrapper.emitted('end')).toBeTruthy()

    const btnSave = findBtn('Sauvegarder')
    expect(btnSave).toBeDefined()
    await btnSave?.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()

    const btnResume = findBtn('Reprendre')
    expect(btnResume).toBeDefined()
    await btnResume?.trigger('click')
    // Close sets modelValue to false
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])

    const btnDelete = findBtn('Supprimer')
    expect(btnDelete).toBeDefined()
    await btnDelete?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it("masque les boutons d'action si la session est terminée", async () => {
    // Create explicitly ended session
    const endedSession: Session = {
      ...mockSession,
      ended: true,
    }

    const wrapper = mount(SessionPauseDialog, {
      props: {
        modelValue: true,
        session: endedSession,
      },
      global: {
        stubs: {
          'v-dialog': { template: '<div><slot /></div>', props: ['modelValue'] },
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          AppBtn: { template: '<button class="app-btn-stub"><slot /></button>' },
        },
      },
    })

    // Debug
    console.log('Ended session render:', wrapper.html())

    const buttons = wrapper.findAll('.app-btn-stub')
    const findBtn = (text: string) => buttons.find((b) => b.text().includes(text))

    expect(findBtn('Recommencer')).toBeDefined() // Always visible
    expect(findBtn('Terminer')).toBeDefined() // Always visible

    expect(findBtn('Sauvegarder')).toBeUndefined()
    expect(findBtn('Reprendre')).toBeUndefined()
    expect(findBtn('Supprimer')).toBeUndefined()
  })
})
