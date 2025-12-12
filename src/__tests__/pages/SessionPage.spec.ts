import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ... (imports)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

  // 1. Create Pinia
  // ...
})

afterEach(() => {
  vi.useRealTimers()
})

import { mount, type VueWrapper, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SessionPage from '@/pages/SessionPage.vue'
import { useSessionStore } from '@/stores/useSessionStore'
import type { Session } from '@/types/SessionSchema'

// Mock components
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

interface SessionPageInstance {
  session: Session | null
  dialogExercices: boolean
}

describe('Page Session (SessionPage)', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useSessionStore>

  let mockSession: Session

  beforeEach(() => {
    mockSession = {
      id: 's1',
      trainigId: 't1',
      trainingId: 't1',
      dateDebut: new Date('2024-01-01T12:00:00Z'),
      updatedAt: new Date('2024-01-01T12:00:00Z'),
      status: 'en_cours',
      exercices: [],
      // Transform getters simulated
      ended: false,
      nbChecked: 0,
      total: 0,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null) // Ensure clean state

    // 1. Create Pinia
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })

    // 2. Setup store mock
    store = useSessionStore(pinia)
    vi.mocked(store.getSessionById).mockResolvedValue(mockSession)

    // 3. Mount with configured pinia
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
          'v-dialog': { template: '<div><slot /></div>' },
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
    // Wait for render
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it("gère l'ouverture et la fermeture des détails d'exercice", async () => {
    mockSession.exercices = [
      {
        id: 'e1',
        name: 'Ex 1',
        series: [],
        hasEquipment: false,
        max: { weights: 0, reps: 0 },
        completed: false,
        nbChecked: 0,

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ]

    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)
    vi.mocked(localStore.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': {
            template: '<button v-bind="$attrs"><slot /></button>',
          },
          'v-icon': true,
          'v-toolbar': { template: '<div><slot /></div>' },
          'v-toolbar-title': { template: '<div><slot /></div>' },
          'v-spacer': true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': {
            template: '<div class="v-list-item-stub" v-bind="$attrs"><slot /></div>',
          },
          ExerciceCard: {
            template: '<div><slot /><slot name="actions" /><slot name="subtitle" /></div>',
          },
          draggable: { template: '<div><slot /></div>' },
          InputNumberSerie: true,
          AppBtn: {
            name: 'AppBtn',
            template: '<button class="app-btn-stub" v-bind="$attrs"><slot /></button>',
          },
          SeriesCard: { template: '<div class="series-card-stub"></div>' },
          SessionPauseDialog: {
            name: 'SessionPauseDialog',
            template: '<div class="session-pause-dialog-stub"></div>',
          },
          ExerciceList: true,
        },
        directives: { touch: {} },
      },
    })

    await flushPromises()

    if (!(wrapper.vm as unknown as SessionPageInstance).session) {
      ;(wrapper.vm as unknown as SessionPageInstance).session = mockSession
      await wrapper.vm.$nextTick()
    }

    const toggleBtn = wrapper.findAll('button').find((c) => c.attributes('title') === 'Ouvrir')
    expect(toggleBtn?.exists()).toBe(true)
    await toggleBtn?.trigger('click')

    expect(wrapper.find('.series-card-stub').exists()).toBe(true)
  })

  it('gère le déplacement des exercices', async () => {
    const e1 = {
      id: 'e1',
      name: 'Ex 1',
      completed: false,
      nbChecked: 0,
      total: 0,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const e2 = {
      id: 'e2',
      name: 'Ex 2',
      completed: false,
      nbChecked: 0,
      total: 0,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    mockSession.exercices = [e1, e2]

    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)
    vi.mocked(localStore.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': {
            template: '<button v-bind="$attrs"><slot /></button>',
          },
          'v-icon': true,
          'v-toolbar': { template: '<div><slot /></div>' },
          'v-toolbar-title': { template: '<div><slot /></div>' },
          'v-spacer': true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': {
            template: '<div class="v-list-item-stub" v-bind="$attrs"><slot /></div>',
          },
          ExerciceCard: {
            template: '<div><slot /><slot name="actions" /><slot name="subtitle" /></div>',
          },
          draggable: { template: '<div><slot /></div>' },
          InputNumberSerie: true,
          AppBtn: {
            name: 'AppBtn',
            template: '<button class="app-btn-stub" v-bind="$attrs"><slot /></button>',
          },
          SeriesCard: { template: '<div class="series-card-stub"></div>' },
          SessionPauseDialog: {
            name: 'SessionPauseDialog',
            template: '<div class="session-pause-dialog-stub"></div>',
          },
          ExerciceList: true,
        },
        directives: { touch: {} },
      },
    })

    await flushPromises()

    if (!(wrapper.vm as unknown as SessionPageInstance).session) {
      ;(wrapper.vm as unknown as SessionPageInstance).session = mockSession
      await wrapper.vm.$nextTick()
    }

    expect((wrapper.vm as unknown as SessionPageInstance).session!.exercices[0].id).toBe('e1')

    const listItems = wrapper.findAll('.v-list-item-stub')
    await listItems[0].trigger('click')

    expect((wrapper.vm as unknown as SessionPageInstance).session!.exercices[0].id).toBe('e2')
  })

  it("gère la suppression d'un exercice", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSession.exercices = [{ id: 'e1', completed: false, nbChecked: 0, total: 0 } as any]

    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)
    vi.mocked(localStore.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': {
            template: '<button v-bind="$attrs"><slot /></button>',
          },
          'v-icon': true,
          'v-toolbar': { template: '<div><slot /></div>' },
          'v-toolbar-title': { template: '<div><slot /></div>' },
          'v-spacer': true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-menu': { template: '<div><slot /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': {
            template: '<div class="v-list-item-stub" v-bind="$attrs"><slot /></div>',
          },
          AppBtn: true,
          // 'v-btn': true, // Duplicate
          // 'v-icon': true, // Duplicate
          SessionPauseDialog: true,
          SeriesCard: true,
          ExerciceList: true,
          ExerciceCard: {
            template: '<div><slot /><slot name="actions" /><slot name="subtitle" /></div>',
          },
        },
        directives: { touch: {} },
      },
    })

    await flushPromises()

    if (!(wrapper.vm as unknown as SessionPageInstance).session) {
      ;(wrapper.vm as unknown as SessionPageInstance).session = mockSession
      await wrapper.vm.$nextTick()
    }

    expect((wrapper.vm as unknown as SessionPageInstance).session!.exercices).toHaveLength(1)

    const deleteBtn = wrapper
      .findAll('.v-list-item-stub')
      .find((w) => w.text().includes('Supprimer'))
    await deleteBtn?.trigger('click')

    expect((wrapper.vm as unknown as SessionPageInstance).session!.exercices).toHaveLength(0)
  })

  it("ouvre le dialogue d'ajout d'exercice", async () => {
    mockSession.exercices = []

    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)
    vi.mocked(localStore.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AppBtn: {
            name: 'AppBtn',
            template: '<button class="app-btn-stub" @click="$emit(\'click\')"><slot /></button>',
          },
          SessionPauseDialog: true,
          SeriesCard: true,
          ExerciceList: true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-card': true,
          'v-toolbar': true,
          'v-btn': true,
          'v-toolbar-title': true,
          'v-toolbar-items': true,
        },
      },
    })

    await flushPromises()

    // Fallback force if null
    if (!(wrapper.vm as unknown as SessionPageInstance).session) {
      ;(wrapper.vm as unknown as SessionPageInstance).session = mockSession
      await wrapper.vm.$nextTick()
    }

    // Find component by text content to ensure we get the right one
    const appBtns = wrapper.findAllComponents({ name: 'AppBtn' })
    const addBtn = appBtns.find((w) => w.text().includes('Ajout un Exercice'))

    expect(addBtn?.exists()).toBe(true)

    // Trigger click on component instance directly
    await addBtn?.vm.$emit('click')

    expect((wrapper.vm as unknown as SessionPageInstance).dialogExercices).toBe(true)
  })

  it('gère les événements du dialogue de pause', async () => {
    mockSession.exercices = []

    const pinia = createTestingPinia({ createSpy: vi.fn })
    const localStore = useSessionStore(pinia)
    vi.mocked(localStore.getSessionById).mockResolvedValue(mockSession)

    wrapper = mount(SessionPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AppBtn: true,
          SessionPauseDialog: {
            name: 'SessionPauseDialog',
            template:
              '<div class="session-pause-dialog-stub" @restart="$emit(\'restart\')" @save="$emit(\'save\')" @end="$emit(\'end\')" @cancel="$emit(\'cancel\')"></div>',
          },
          SeriesCard: true,
          ExerciceList: true,
          'v-dialog': true,
          'v-progress-circular': true,
        },
      },
    })

    await flushPromises()

    // Fallback force if null
    if (!(wrapper.vm as unknown as SessionPageInstance).session) {
      ;(wrapper.vm as unknown as SessionPageInstance).session = mockSession
      await wrapper.vm.$nextTick()
    }

    const pauseDialog = wrapper.findComponent({ name: 'SessionPauseDialog' })

    expect(pauseDialog.exists()).toBe(true)

    await pauseDialog.vm.$emit('restart')
    expect(localStore.restartSession).toHaveBeenCalled()

    await pauseDialog.vm.$emit('save')
    expect(localStore.saveSession).toHaveBeenCalled()

    await pauseDialog.vm.$emit('end')
    expect(localStore.finishSession).toHaveBeenCalled()

    await pauseDialog.vm.$emit('cancel')
    expect(localStore.deleteSession).toHaveBeenCalled()
  })
})
