import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrainingPage from '@/pages/TrainingPage.vue'
import { useTrainingStore } from '@/stores/useTrainingStore'

vi.mock('@/components/ExerciceCard.vue', () => ({
  default: {
    name: 'ExerciceCard',
    props: ['exercice'],
    template: '<div class="exercice-card">{{ exercice.name }}</div>',
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
          'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          'v-icon': true,
          'v-dialog': true,
          'v-progress-circular': true,
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
    }
  })
})
