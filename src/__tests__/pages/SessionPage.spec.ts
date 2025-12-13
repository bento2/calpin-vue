import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SessionPage from '@/pages/SessionPage.vue'
import { useSessionStore } from '@/stores/useSessionStore'
import type { Session } from '@/types/SessionSchema'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema'

// Mock des sous-composants
vi.mock('@/components/SessionCard.vue', () => ({
  default: { template: '<div>SessionCard Stub</div>' },
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({ params: { id: 's1' } })),
}))

// Helper pour créer des exercices de test
const createExercice = (id: string, name: string): ExerciceSeries => ({
  id,
  name,
  series: [],
  total: 0,
  nbChecked: 0,
  completed: false,
  max: { total: 0, poids: 0, repetitions: 0 },
  hasEquipment: false,
  difficulty: 'débutant',
  description: '',
  instructions: '',
  equipment: '',
  type: 'weight',
  muscles_principaux: [],
  muscles_secondaires: [],
})

interface SessionPageInstance {
  session: Session | null
  dialogExercices: boolean
  isOpen: (index: number) => boolean
}

describe('Page Session (SessionPage)', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useSessionStore>
  let mockSession: Session

  const createWrapper = () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    store = useSessionStore(pinia)
    vi.mocked(store.getSessionById).mockResolvedValue(mockSession)

    return mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': {
            props: ['text'],
            template:
              '<button v-bind="$attrs" @click="$emit(\'click\')">{{ text }}<slot /></button>',
          },
          'v-icon': true,
          'v-toolbar': { name: 'v-toolbar', template: '<div><slot /></div>' },
          'v-toolbar-title': { template: '<div><slot /></div>' },
          'v-spacer': true,
          'v-dialog': { name: 'v-dialog', template: '<div><slot /></div>', props: ['modelValue'] },
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': {
            template:
              '<div class="v-list-item-stub" v-bind="$attrs" @click="$emit(\'click\')"><slot /></div>',
          },
          ExerciceCard: {
            template: '<div><slot /><slot name="actions" /><slot name="subtitle" /></div>',
          },
          draggable: { template: '<div><slot /></div>' },
          InputNumberSerie: true,
          AppBtn: {
            name: 'AppBtn',
            template:
              '<button class="app-btn-stub" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          },
          SeriesCard: {
            name: 'SeriesCard',
            template: '<div class="series-card-stub"></div>',
            props: ['modelValue'],
            emits: ['update:modelValue'],
          },
          SessionPauseDialog: {
            name: 'SessionPauseDialog',
            template: '<div class="session-pause-dialog-stub"></div>',
            emits: ['restart', 'save', 'end', 'cancel'],
            props: ['modelValue'],
          },
          ExerciceList: true,
          'v-progress-circular': true,
          'v-chip': true,
          SessionExerciceItem: {
            name: 'SessionExerciceItem',
            template: '<div class="session-exercice-item-stub" />',
            props: ['exercice', 'index', 'isOpen', 'isLast'],
            emits: ['move-up', 'move-down', 'remove', 'toggle'],
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    mockSession = {
      id: 's1',
      trainingId: 't1',
      name: 'Session Test',
      dateDebut: new Date('2024-01-01T12:00:00Z'),
      updatedAt: new Date('2024-01-01T12:00:00Z'),
      status: 'en_cours',
      exercices: [],
      ended: false,
      nbChecked: 0,
      total: 0,
    }

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('charge la session au montage', () => {
    wrapper = createWrapper()
    expect(store.getSessionById).toHaveBeenCalledWith('s1')
  })

  it('affiche le titre de la session', async () => {
    wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Session Test')
  })

  it('charge depuis localStorage si présent', async () => {
    const localSession = { ...mockSession, name: 'Local Session' }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(localSession))

    wrapper = createWrapper()
    await flushPromises()

    expect(store.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Local Session' }),
    )
  })

  it('gère une erreur de parsing localStorage', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('invalid json')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    wrapper = createWrapper()
    await flushPromises()

    expect(consoleSpy).toHaveBeenCalled()
    expect(store.getSessionById).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("gère l'ouverture et la fermeture des détails d'exercice", async () => {
    mockSession.exercices = [createExercice('e1', 'Ex 1')]
    wrapper = createWrapper()
    await flushPromises()

    const item = wrapper.findComponent({ name: 'SessionExerciceItem' })
    await item.vm.$emit('toggle', 0)
    expect(wrapper.find('.series-card-stub').exists()).toBe(true)

    await item.vm.$emit('toggle', 0)
    expect(wrapper.find('.series-card-stub').exists()).toBe(false)
  })

  it('sauvegarde dans localStorage lors des changements (debounce simulation)', async () => {
    wrapper = createWrapper()
    await flushPromises()

    // Inject session manually because relying on store mock return might not update the ref inside component
    // if getSessionById returns a value that is then assigned to ref.
    // But since store.getSessionById returns a generic object, and component uses `session.value = loadedSession`,
    // the component has its own reactive object.

    // Trigger change
    const session = (wrapper.vm as unknown as SessionPageInstance).session
    if (session) {
      session.nbChecked = 1
    }

    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(2000)

    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('met à jour la session quand les séries changent (via v-model SeriesCard)', async () => {
    mockSession.exercices = [createExercice('e1', 'Ex 1')]
    wrapper = createWrapper()
    await flushPromises()

    // Open exercice to see SeriesCard
    const item = wrapper.findComponent({ name: 'SessionExerciceItem' })
    await item.vm.$emit('toggle', 0)

    const seriesCard = wrapper.findComponent({ name: 'SeriesCard' })
    expect(seriesCard.exists()).toBe(true)

    // Emit update from SeriesCard
    seriesCard.vm.$emit('update:modelValue', [{ id: 's1', reps: 10, weight: 50, checked: true }])

    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(2000)

    // Should trigger save
    expect(localStorage.setItem).toHaveBeenCalled()

    // Also since nbChecked didn't change (still 0 to logic unless calculated property changed?
    // Actually we didn't update overall session nbChecked property, just deep property of exercice.
    // However, watch is deep.
    // Line 59: saveLocal(newValue) is ALWAYS called on deep change.
    // Line 62: debouncedUpdate is called ONLY if nbChecked changed.
    // So modifying series inside via v-model triggers saveLocal.

    // To verify saveLocal: verify localStorage.setItem was called with new data
    const lastCall = vi.mocked(localStorage.setItem).mock.lastCall
    expect(lastCall).toBeDefined()
    if (lastCall) {
      expect(lastCall[1]).toContain('"reps":10')
    }
  })

  describe('Actions et Dialogues', () => {
    beforeEach(() => {
      mockSession.exercices = [createExercice('e1', 'Ex1'), createExercice('e2', 'Ex2')]
      wrapper = createWrapper()
    })

    it('supprime un exercice via event', async () => {
      await flushPromises()
      const items = wrapper.findAllComponents({ name: 'SessionExerciceItem' })
      expect(items.length).toBe(2)

      await items[0].vm.$emit('remove', 'e1')

      const session = (wrapper.vm as unknown as SessionPageInstance).session
      expect(session?.exercices.findIndex((e) => e.id === 'e1')).toBe(-1)
      expect(session?.exercices.length).toBe(1)
    })

    it('déplace un exercice (move-down)', async () => {
      await flushPromises()
      const items = wrapper.findAllComponents({ name: 'SessionExerciceItem' })

      await items[0].vm.$emit('move-down', 0)

      const session = (wrapper.vm as unknown as SessionPageInstance).session
      expect(session?.exercices[0].name).toBe('Ex2')
      expect(session?.exercices[1].name).toBe('Ex1')

      // Verification inverse (move-up)
      // Let's just emit on the new second item (index 1, was Ex1)
      // Access internal method moveUp via VM check if exposed or simulates via event on item
      // The component SessionExerciceItem emits 'move-up'. Parent handles it.
      // So to test moveUp logic in component, we should emit event from child again.
      const newItems = wrapper.findAllComponents({ name: 'SessionExerciceItem' })
      await newItems[1].vm.$emit('move-up', 1)

      expect(session?.exercices[0].name).toBe('Ex1')
    })

    it('gère les events du dialogue pause', async () => {
      await flushPromises()
      const dialog = wrapper.findComponent({ name: 'SessionPauseDialog' })

      dialog.vm.$emit('restart')
      expect(store.restartSession).toHaveBeenCalled()

      dialog.vm.$emit('save')
      expect(store.saveSession).toHaveBeenCalled()

      // New tests for missing coverage
      await dialog.vm.$emit('cancel')
      expect(store.deleteSession).toHaveBeenCalled()
      expect(localStorage.removeItem).toHaveBeenCalled()

      await dialog.vm.$emit('end')
      expect(store.finishSession).toHaveBeenCalled()
    })

    it("gère le swap d'exercices correctement (move internal logic)", async () => {
      await flushPromises()
      const session = (wrapper.vm as unknown as SessionPageInstance).session
      expect(session?.exercices[0].name).toBe('Ex1')
      expect(session?.exercices[1].name).toBe('Ex2')

      // Move Ex1 down (which is at index 0)
      // Simulate by calling the method if we want to confirm the logic *inside* the component
      // But we already tested "déplace un exercice (move-down)" which tests the outcome.
      // The user pointed to line 112: `exercices[index] = exercices[index + step]`.
      // This is covererd by `move` which is called by `moveDown`.
      // Let's ensure we hit the swap logic fully.

      // Actually, let's verify invalid moves (already tested?).
      // 'ne déplace pas si invalide' tests if step < 0 && index <= 0.
      // Let's test step > 0 && index >= len -1.

      const items = wrapper.findAllComponents({ name: 'SessionExerciceItem' })
      // Try to move last item down
      await items[1].vm.$emit('move-down', 1)
      expect(session?.exercices[1].name).toBe('Ex2') // Should stay same
    })

    it("ouvre et ferme le dialogue d'ajout d'exercice", async () => {
      await flushPromises()
      const addBtn = wrapper
        .findAllComponents({ name: 'AppBtn' })
        .find((c) => c.text().includes('Ajout un Exercice'))

      expect(addBtn?.exists()).toBe(true)

      const exerciseDialog = wrapper.findComponent({ name: 'v-dialog' })
      expect(exerciseDialog.props('modelValue')).toBe(false)

      await addBtn?.vm.$emit('click')
      expect(exerciseDialog.props('modelValue')).toBe(true)

      // Close logic via icon
      const closeIcon = wrapper.findComponent({ name: 'v-toolbar' }).find('button')
      await closeIcon.trigger('click')
      expect(exerciseDialog.props('modelValue')).toBe(false)

      // Re-open and close via "Fermer" button
      await addBtn?.vm.$emit('click')

      // We need to find the specific button with text "Fermer"
      // Since AppBtn is stubbed with text slots, we might need to look deeper or rely on classes.
      // The "Fermer" button is a v-btn, not AppBtn. Stubbbed as <button ...><slot/></button>
      const buttons = wrapper.findAll('button')
      const closeTextBtn = buttons.find((b) => b.text().includes('Fermer'))

      expect(closeTextBtn?.exists()).toBe(true)
      await closeTextBtn?.trigger('click')
      expect(exerciseDialog.props('modelValue')).toBe(false)
    })

    it('ouvre le menu pause au clic sur le bouton pause', async () => {
      await flushPromises()
      // Pause button has icon "mdi-pause"
      // Find AppBtn with this icon
      const pauseBtn = wrapper
        .findAllComponents({ name: 'AppBtn' })
        .find((c) => c.attributes('icon') === 'mdi-pause')

      expect(pauseBtn?.exists()).toBe(true)

      const sessionPauseDialog = wrapper.findComponent({ name: 'SessionPauseDialog' })
      expect(sessionPauseDialog.props('modelValue')).toBe(false)

      await pauseBtn?.vm.$emit('click')
      expect(sessionPauseDialog.props('modelValue')).toBe(true)
    })
  })
})
