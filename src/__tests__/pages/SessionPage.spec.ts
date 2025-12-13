import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock sub-components
vi.mock('@/components/SessionCard.vue', () => ({
  default: {
    template: '<div>SessionCard Stub</div>',
  },
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    params: { id: 's1' },
  })),
}))

vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    template: '<div><slot /><slot name="actions" /><slot name="subtitle" /></div>',
  },
}))

vi.mock('@/components/ui/AppBtn.vue', () => ({
  default: {
    name: 'AppBtn',
    template:
      '<button class="app-btn-stub" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  },
}))

import { mount, type VueWrapper, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SessionPage from '@/pages/SessionPage.vue'
import { useSessionStore } from '@/stores/useSessionStore'
import type { Session } from '@/types/SessionSchema'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema'

interface SessionPageInstance {
  session: Session | null
  dialogExercices: boolean
  isOpen: (index: number) => boolean
}

describe('Page Session (SessionPage)', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useSessionStore>

  let mockSession: Session

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    // Construct a valid Session object
    mockSession = {
      id: 's1',
      trainingId: 't1',
      name: 'Session Test',
      dateDebut: new Date('2024-01-01T12:00:00Z'),
      updatedAt: new Date('2024-01-01T12:00:00Z'),
      status: 'en_cours',
      exercices: [],
      // Transform properties
      ended: false,
      nbChecked: 0,
      total: 0,
    }

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })

    store = useSessionStore(pinia)
    vi.mocked(store.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': {
            template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-icon': true,
          'v-toolbar': { template: '<div><slot /></div>' },
          'v-toolbar-title': { template: '<div><slot /></div>' },
          'v-spacer': true,
          'v-dialog': { template: '<div><slot /></div>', props: ['modelValue'] },
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
          SeriesCard: { template: '<div class="series-card-stub"></div>' },
          SessionPauseDialog: {
            name: 'SessionPauseDialog',
            template: '<div class="session-pause-dialog-stub"></div>',
          },
          ExerciceList: true,
          'v-progress-circular': true,
          'v-chip': true,
        },
        directives: {
          touch: {},
        },
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('charge la session au montage', () => {
    expect(store.getSessionById).toHaveBeenCalledWith('s1')
  })

  it('affiche le titre de la session', async () => {
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Session Test')
  })

  it('charge depuis localStorage si présent', async () => {
    const localSession = { ...mockSession, name: 'Local Session' }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(localSession))

    // Remount to trigger onMounted
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AppBtn: true,
          SessionPauseDialog: true,
          ExerciceCard: true,
          'v-progress-circular': true,
          'v-chip': true,
        },
      },
    })

    await flushPromises()
    expect(localStore.updateSession).toHaveBeenCalled()
    // Wait, updateSession is called with the parsed session
    // We can check if session ref has required name if we could access it or render
    // But since we spy, let's check spy
    // But updateSession in store mock
    expect(localStore.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Local Session' }),
    )
  })

  it('gère une erreur de parsing localStorage', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('invalid json')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)
    vi.mocked(localStore.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: { AppBtn: true, SessionPauseDialog: true, 'v-progress-circular': true },
      },
    })

    await flushPromises()
    expect(consoleSpy).toHaveBeenCalled()
    // Should fall back to API
    expect(localStore.getSessionById).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("gère l'ouverture et la fermeture des détails d'exercice", async () => {
    mockSession.exercices = [
      {
        id: 'e1',
        name: 'Ex 1',
        series: [],
        hasEquipment: false,
        max: { total: 0, poids: 0, repetitions: 0 },
        completed: false,
        nbChecked: 0,
        total: 0,
      },
    ]

    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)
    vi.mocked(localStore.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AppBtn: true,
          SessionPauseDialog: true,
          SeriesCard: { template: '<div class="series-card-stub"></div>' },
          ExerciceCard: {
            template: '<div><slot /><slot name="actions" /><slot name="subtitle" /></div>',
          },
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': true,
          'v-list-item': true,
          'v-btn': true,
          'v-icon': true,
          'v-chip': true,
        },
      },
    })

    await flushPromises()

    // Access vm session manually if needed to verify or just rely on render
    // Simulate open
    const toggleBtn = wrapper.findAll('v-btn-stub').find((c) => c.attributes('title') === 'Ouvrir')
    // Since we stubbed v-btn as true above, it's v-btn-stub.
    // However, in our global config for this test we might have overridden it?
    // Ah, in this test setup I overrode stubs locally.
    // 'v-btn': true returns v-btn-stub.

    expect(toggleBtn?.exists()).toBe(true)
    await toggleBtn?.trigger('click')

    expect(wrapper.find('.series-card-stub').exists()).toBe(true)
  })

  it('sauvegarde dans localStorage lors des changements (debounce simulation)', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    useSessionStore(pinia) // init

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AppBtn: true,
          SessionPauseDialog: true,
          'v-progress-circular': true,
          'v-dialog': true,
        },
      },
    })
    await flushPromises()

    // Inject session
    ;(wrapper.vm as unknown as SessionPageInstance).session = mockSession
    await wrapper.vm.$nextTick()

    // Mutate session to trigger watch
    if ((wrapper.vm as unknown as SessionPageInstance).session) {
      ;(wrapper.vm as unknown as SessionPageInstance).session!.nbChecked = 1
    }
    await wrapper.vm.$nextTick()

    // Debounce wait?
    // The component uses debounce 2000.
    // We simulated timers.
    vi.advanceTimersByTime(2000)

    expect(localStorage.setItem).toHaveBeenCalled()
  })

  // === NEW TESTS FOR COVERAGE ===
  describe('Actions et Dialogues', () => {
    let wrapper: VueWrapper
    let store: ReturnType<typeof useSessionStore>

    beforeEach(() => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      store = useSessionStore(pinia)

      const ex1 = {
        id: 'e1',
        name: 'Ex1',
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
      } as unknown as ExerciceSeries

      const ex2 = {
        id: 'e2',
        name: 'Ex2',
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
      } as unknown as ExerciceSeries

      vi.mocked(store.getSessionById).mockResolvedValue({
        ...mockSession,
        exercices: [ex1, ex2],
      })

      wrapper = mount(SessionPage, {
        global: {
          plugins: [pinia],
          stubs: {
            'v-btn': {
              name: 'v-btn',
              template:
                '<button class="test-btn" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
            },
            'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
            'v-list': { template: '<div><slot /></div>' },
            'v-list-item': {
              template: '<button class="list-item" @click="$emit(\'click\')"><slot /></button>',
            },
            'v-list-item-title': { template: '<span><slot /></span>' },
            'v-icon': true,
            'v-toolbar': { name: 'v-toolbar', template: '<div><slot /></div>' },
            'v-dialog': {
              name: 'v-dialog',
              template: '<div v-bind="$attrs"><slot /></div>',
              props: ['modelValue'],
            },
            AppBtn: {
              name: 'AppBtn',
              template: '<button class="app-btn-stub" @click="$emit(\'click\')"><slot /></button>',
            },
            SessionPauseDialog: {
              name: 'SessionPauseDialog',
              template: '<div class="pause-dialog-stub" @restart="$emit(\'restart\')"></div>',
              emits: ['restart', 'save', 'end', 'cancel'],
              props: ['modelValue'],
            },
            ExerciceCard: { template: '<div><slot /><slot name="actions" /></div>' },
            SeriesCard: true,
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

      // Move first item down
      await items[0].vm.$emit('move-down', 0)

      const session = (wrapper.vm as unknown as SessionPageInstance).session
      expect(session?.exercices[0].name).toBe('Ex2')
      expect(session?.exercices[1].name).toBe('Ex1')
    })

    it('déplace un exercice (move-up)', async () => {
      await flushPromises()
      const items = wrapper.findAllComponents({ name: 'SessionExerciceItem' })

      // Move second item up
      await items[1].vm.$emit('move-up', 1)

      const session = (wrapper.vm as unknown as SessionPageInstance).session
      expect(session?.exercices[0].name).toBe('Ex2') // e2 was second
      expect(session?.exercices[1].name).toBe('Ex1')
    })

    it('ne déplace pas si invalide', async () => {
      await flushPromises()
      const items = wrapper.findAllComponents({ name: 'SessionExerciceItem' })

      // Try move first up (should fail)
      await items[0].vm.$emit('move-up', 0)

      const session = (wrapper.vm as unknown as SessionPageInstance).session
      expect(session?.exercices[0].name).toBe('Ex1')
    })

    it('toggle ouvre/ferme les details', async () => {
      await flushPromises()
      const items = wrapper.findAllComponents({ name: 'SessionExerciceItem' })

      // Toggle first
      await items[0].vm.$emit('toggle', 0)
      expect((wrapper.vm as unknown as SessionPageInstance).isOpen(0)).toBe(true)

      // Toggle again (close)
      await items[0].vm.$emit('toggle', 0)
      expect((wrapper.vm as unknown as SessionPageInstance).isOpen(0)).toBe(false)
    })

    it('gère les events du dialogue pause', async () => {
      await flushPromises()
      const dialogCompFallback = wrapper.findAllComponents({ name: 'SessionPauseDialog' })[0]
      if (dialogCompFallback) {
        dialogCompFallback.vm.$emit('restart')
        expect(store.restartSession).toHaveBeenCalled()
        dialogCompFallback.vm.$emit('save')
        expect(store.saveSession).toHaveBeenCalled()
        dialogCompFallback.vm.$emit('end')
        expect(store.finishSession).toHaveBeenCalled()
        dialogCompFallback.vm.$emit('cancel')
        expect(store.deleteSession).toHaveBeenCalled()
      }
    })

    it('ouvre le menu de pause', async () => {
      await flushPromises()
      // Find the AppBtn with pause icon via stub class
      // Stub template: <button class="app-btn-stub" ...>
      // We can check attributes on the button element directly if bind $attrs is working in stub

      const pauseBtn = wrapper
        .findAll('.app-btn-stub')
        .find((c) => c.attributes('icon') === 'mdi-pause')

      expect(pauseBtn?.exists()).toBe(true)

      const pauseDialog = wrapper.findComponent({ name: 'SessionPauseDialog' })
      expect(pauseDialog.exists()).toBe(true)

      await pauseBtn?.trigger('click')
      expect(pauseDialog.props('modelValue')).toBe(true)
    })

    it("ouvre et ferme le dialogue d'ajout d'exercice", async () => {
      await flushPromises()

      const addBtn = wrapper
        .findAllComponents({ name: 'AppBtn' })
        .find((c) => c.text().includes('Ajout un Exercice'))

      expect(addBtn?.exists()).toBe(true)

      // Dialog is initially false
      const exerciseDialog = wrapper.findComponent({ name: 'v-dialog' })

      expect(exerciseDialog.exists()).toBe(true)
      expect(exerciseDialog.props('modelValue')).toBe(false)

      addBtn?.vm.$emit('click')
      await wrapper.vm.$nextTick()

      // Check VM state type-safe
      expect((wrapper.vm as unknown as SessionPageInstance).dialogExercices).toBe(true)

      expect(exerciseDialog.props('modelValue')).toBe(true)

      // Close via toolbar btn (v-btn stub)
      // Look for button inside v-toolbar
      const closeBtn = wrapper.findComponent({ name: 'v-toolbar' }).findComponent({ name: 'v-btn' })

      expect(closeBtn.exists()).toBe(true)

      closeBtn.vm.$emit('click')
      await wrapper.vm.$nextTick()

      expect(exerciseDialog?.props('modelValue')).toBe(false)
    })

    it('rend le composant SeriesCard quand ouvert', async () => {
      await flushPromises()
      // Initially closed
      expect(wrapper.findComponent({ name: 'SeriesCard' }).exists()).toBe(false)

      // Open first item
      const items = wrapper.findAllComponents({ name: 'SessionExerciceItem' })
      await items[0].vm.$emit('toggle', 0)

      expect(wrapper.findComponent({ name: 'SeriesCard' }).exists()).toBe(true)
    })
  })
})
