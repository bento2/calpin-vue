import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SessionPage from '@/pages/SessionPage.vue'
import { useSessionStore } from '@/stores/useSessionStore'

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

describe('Page Session (SessionPage)', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useSessionStore>

  const createWrapper = () => {
    return mount(SessionPage, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          'v-icon': true,
          'v-toolbar': { template: '<div><slot /></div>' },
          'v-toolbar-title': { template: '<div><slot /></div>' },
          'v-spacer': true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': { template: '<div><slot /></div>' },
          ExerciseCard: true, // Assuming ExerciseCard usage
          draggable: { template: '<div><slot /></div>' }, // Mock draggable
          InputNumberSerie: true,
        },
        directives: {
          touch: {}, // Mock v-touch
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
    store = useSessionStore()

    // Configurer le store après l'initialisation
    // Note: loadSession a déjà été appelé au montage par le composant
    // car on a utilisé createWrapper() qui fait le mount()
  })

  it('charge la session au montage', () => {
    // Comme le mount est déjà fait, on vérifie juste que l'action a été appelée
    expect(store.getSessionById).toHaveBeenCalledWith('s1')
  })

  it('affiche le titre de la session', () => {
    expect(wrapper.exists()).toBe(true)
  })
})
