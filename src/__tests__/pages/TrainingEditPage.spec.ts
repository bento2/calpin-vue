import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrainingPage from '@/pages/TrainingPage.vue'
import { useTrainingStore } from '@/stores/useTrainingStore'

vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    props: ['exercice'],
    template: '<div class="exercice-card">{{ exercice.name }}<slot name="actions" /></div>',
  },
}))

vi.mock('vuedraggable', () => ({
  default: {
    name: 'draggable',
    template:
      '<div><slot name="item" v-for="(element, index) in modelValue" :element="element" :index="index"></slot></div>',
    props: ['modelValue'],
  },
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    params: { id: 't1' },
  })),
}))

interface TrainingPageInstance {
  dialog: boolean
  training: Training
}

describe('Page Edition Entrainement (TrainingPage)', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useTrainingStore>

  beforeEach(() => {
    // Create Pinia instance first
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })

    // Setup store mock BEFORE mounting because onMounted calls it immediately
    store = useTrainingStore(pinia)
    ;(store.getTrainingById as Mock).mockResolvedValue({
      id: 't1',
      name: 'Training Test',
      exercices: [{ id: 'e1', name: 'Ex 1' }],
      ctime: new Date(),
      mtime: new Date(),
    })

    // Mount using the pre-configured pinia
    wrapper = mount(TrainingPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-card': { template: '<div><slot /><slot name="actions" /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-item': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-text-field': {
            name: 'v-text-field',
            props: ['modelValue'],
            template: '<div class="v-text-field-stub">{{ modelValue }}</div>',
          },
          'v-btn': {
            template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-icon': true,
          'v-dialog': { template: '<div><slot /></div>' },
          'v-progress-circular': true,
          'v-menu': { template: '<div><slot /><slot name="activator" :props="{}" /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': {
            template: '<div class="v-list-item-stub" @click="$emit(\'click\')"><slot /></div>',
          },
          'v-list-item-title': { template: '<div><slot /></div>' },
          Exercices: {
            name: 'Exercices',
            template: '<div class="exercices-stub"></div>',
            props: ['selected'],
            emits: ['update:selected'],
          },
        },
      },
    })
  })

  it("charge et affiche l'entrainement existant", async () => {
    await flushPromises()
    expect(store.getTrainingById).toHaveBeenCalledWith('t1')

    const tf = wrapper.find('.v-text-field-stub')
    expect(tf.exists()).toBe(true)
    expect(tf.text()).toContain('Training Test')
    expect(wrapper.html()).toMatchSnapshot()
  })

  it("met à jour le nom de l'entrainement", async () => {
    await flushPromises()
    const tf = wrapper.findComponent({ name: 'v-text-field' }) // Finds stub by name

    // Emit update:modelValue from the component instance
    tf.vm.$emit('update:modelValue', 'New Name')

    // Check if store save action is called when save is clicked
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Enregistrer'))
    if (saveBtn) {
      await saveBtn.trigger('click')
      // Check for saveTraining, not updateTraining
      expect(store.saveTraining).toHaveBeenCalled()
      const callArgs = (store.saveTraining as Mock).mock.calls[0][0]
      expect(callArgs.name).toBe('New Name')
    }
  })

  it("gère l'ajout d'exercices", async () => {
    await flushPromises()

    // Open dialog
    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Ajouter un exercice'))
    await addBtn?.trigger('click')

    expect((wrapper.vm as unknown as TrainingPageInstance).dialog).toBe(true)

    // Simulate selection in Exercices component
    const exercicesComp = wrapper.findComponent({ name: 'Exercices' })
    expect(exercicesComp.exists()).toBe(true)

    const newExercices = [
      { id: 'e1', name: 'Ex 1' },
      { id: 'e2', name: 'Ex 2' },
    ]
    exercicesComp.vm.$emit('update:selected', newExercices)

    await flushPromises()

    // Verify training exercises updated
    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices).toHaveLength(2)
    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices[1].id).toBe('e2')
  })

  it("gère la suppression d'un exercice", async () => {
    await flushPromises()

    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices).toHaveLength(1)

    // Find remove button in menu
    // Menu content is usually not rendered until activated, but stub renders slots.
    // v-menu stub: <div><slot /><slot name="activator" /></div>
    // So list items should be visible.

    const removeBtn = wrapper
      .findAll('.v-list-item-stub')
      .find((w) => w.text().includes('Supprimer'))
    expect(removeBtn?.exists()).toBe(true)

    await removeBtn?.trigger('click')

    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices).toHaveLength(0)
  })
})
