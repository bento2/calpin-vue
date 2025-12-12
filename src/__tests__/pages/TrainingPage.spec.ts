import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrainingPage from '@/pages/TrainingPage.vue'
import { useTrainingStore } from '@/stores/useTrainingStore'
import type { Training } from '@/types/TrainingSchema'
import { addExerciceGetters } from '@/types/ExerciceSchema'

// Mock sub-components
vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    template: '<div class="exercice-card-stub"><slot /><slot name="actions" /></div>',
  },
}))

vi.mock('@/components/ExerciceList.vue', () => ({
  default: {
    name: 'ExerciceList',
    template: '<div class="exercice-list-stub">ExerciceList Stub</div>',
    props: ['selected'],
    emits: ['update:selected'],
  },
}))

vi.mock('vuedraggable', () => ({
  default: {
    name: 'draggable',
    template:
      '<div class="draggable-stub"><slot name="item" v-for="(element, index) in modelValue" :element="element" :index="index"></slot></div>',
    props: ['modelValue'],
  },
}))

const mockRouteParams = { value: {} as Record<string, string> }
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: mockRouteParams.value,
  }),
}))

describe('TrainingPage', () => {
  let mockTraining: Training

  beforeEach(() => {
    mockRouteParams.value = {}
    mockTraining = {
      id: 't1',
      name: 'Training Test',
      exercices: [],
      ctime: new Date(),
      mtime: new Date(),
    }
  })

  it("crée un nouvel entrainement si pas d'ID", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useTrainingStore(pinia)
    vi.mocked(store.createTraining).mockResolvedValue(mockTraining)

    const wrapper = mount(TrainingPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-item': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-text-field': true,
          'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          'v-progress-circular': true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': { template: '<div><slot /></div>' },
          'v-list-item-title': { template: '<span><slot /></span>' },
          'v-icon': true,
        },
      },
    })

    expect(store.createTraining).toHaveBeenCalled()
    await flushPromises()
    expect(wrapper.vm.training).toEqual(mockTraining)
  })

  it('charge un entrainement existant si ID fourni', async () => {
    mockRouteParams.value = { id: 't1' }
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useTrainingStore(pinia)
    vi.mocked(store.getTrainingById).mockResolvedValue(mockTraining)

    mount(TrainingPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-item': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-text-field': true,
          'v-btn': true,
          'v-progress-circular': true,
          'v-dialog': true,
          'v-menu': true,
          'v-list': true,
          'v-list-item': true,
          'v-icon': true,
        },
      },
    })

    expect(store.getTrainingById).toHaveBeenCalledWith('t1')
  })

  it('affiche une erreur si chargement échoue', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useTrainingStore(pinia)
    vi.mocked(store.createTraining).mockRejectedValue(new Error('Fail'))

    const wrapper = mount(TrainingPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': { template: '<div class="v-card-stub"><slot /></div>' },
          'v-progress-circular': true,
        },
      },
    })

    await flushPromises()
    expect(wrapper.text()).toContain('Erreur lors du chargement')
  })

  it("gère l'ajout et la suppression d'exercices", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useTrainingStore(pinia)
    vi.mocked(store.createTraining).mockResolvedValue(mockTraining)

    const wrapper = mount(TrainingPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-item': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-text-field': true,
          'v-btn': {
            name: 'v-btn-stub',
            template: '<button class="test-btn" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-progress-circular': true,
          'v-dialog': {
            name: 'v-dialog',
            template: '<div><slot /></div>',
            props: ['modelValue'],
          },
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': {
            name: 'v-list-item-stub',
            template: '<button class="list-item" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-list-item-title': { template: '<span><slot /></span>' },
          'v-icon': true,
        },
      },
    })
    await flushPromises()

    const addBtn = wrapper
      .findAllComponents({ name: 'v-btn-stub' })
      .find((b) => b.text().includes('Ajouter un exercice'))
    await addBtn?.vm.$emit('click')

    const dialog = wrapper.findComponent({ name: 'v-dialog' })
    expect(dialog.props('modelValue')).toBe(true)

    wrapper.vm.training!.exercices.push(
      addExerciceGetters({
        id: 'e1',
        name: 'Squat',
        type: 'weight',
        instructions: 'Instructions here',
      }),
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.exercice-card-stub').length).toBe(1)

    const removeBtn = wrapper
      .findAllComponents({ name: 'v-list-item-stub' })
      .find((b) => b.text().includes('Supprimer'))
    expect(removeBtn?.exists()).toBe(true)
    await removeBtn?.vm.$emit('click')

    expect(wrapper.vm.training!.exercices.length).toBe(0)
  })

  it('gère le déplacement (monter/descendre)', async () => {
    mockTraining.exercices = [
      addExerciceGetters({ id: 'e1', name: 'Ex1' }),
      addExerciceGetters({ id: 'e2', name: 'Ex2' }),
    ]
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useTrainingStore(pinia)
    vi.mocked(store.createTraining).mockResolvedValue(mockTraining)

    const wrapper = mount(TrainingPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-item': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-text-field': true,
          'v-btn': {
            name: 'v-btn-stub',
            template: '<button class="test-btn" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-progress-circular': true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': {
            name: 'v-list-item-stub',
            template: '<button class="list-item" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-list-item-title': { template: '<span><slot /></span>' },
          'v-icon': true,
        },
      },
    })
    await flushPromises()

    const allListItems = wrapper.findAllComponents({ name: 'v-list-item-stub' })
    const moveDownBtns = allListItems.filter((b) => b.text().includes('Descendre'))
    expect(moveDownBtns).toHaveLength(1)

    await moveDownBtns[0].vm.$emit('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.training!.exercices[0].id).toBe('e2')
    expect(wrapper.vm.training!.exercices[1].id).toBe('e1')

    const moveUpBtns = wrapper
      .findAllComponents({ name: 'v-list-item-stub' })
      .filter((b) => b.text().includes('Monter'))
    expect(moveUpBtns).toHaveLength(1)

    await moveUpBtns[0].vm.$emit('click')

    expect(wrapper.vm.training!.exercices[0].id).toBe('e1')
  })

  it("sauvegarde l'entrainement", async () => {
    mockTraining.exercices = [addExerciceGetters({ id: 'e1', name: 'Ex1' })]
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useTrainingStore(pinia)
    vi.mocked(store.createTraining).mockResolvedValue(mockTraining)

    const wrapper = mount(TrainingPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-title': true,
          'v-card-item': true,
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-text-field': true,
          'v-btn': {
            template:
              '<button class="op-btn" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-progress-circular': true,
          'v-dialog': true,
          'v-menu': true,
          'v-list': true,
          'v-list-item': true,
          'v-icon': true,
        },
      },
    })
    await flushPromises()

    const saveBtn = wrapper.findAll('.op-btn').find((b) => b.text().includes('Enregistrer'))
    expect(saveBtn?.attributes('disabled')).toBeUndefined() // or false?
    // If showSave is true, disabled is false or not present.
    // In component: :disabled="!showSave".

    await saveBtn?.trigger('click')
    expect(store.saveTraining).toHaveBeenCalledWith(mockTraining)
  })
})
