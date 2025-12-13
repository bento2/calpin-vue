import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrainingPage from '@/pages/TrainingPage.vue'
import { useTrainingStore } from '@/stores/useTrainingStore'
import type { Training } from '@/types/TrainingSchema'
import type { Exercice } from '@/types/ExerciceSchema'

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
    emits: ['update:modelValue'],
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
  error: string | null
  moveUp: (index: number) => void
}

describe('Page Edition Entrainement (TrainingPage)', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useTrainingStore>

  beforeEach(() => {
    // Create Pinia instance first
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })

    // Configuration du mock du store AVANT le montage car onMounted l'appelle immédiatement
    store = useTrainingStore(pinia)
    ;(store.getTrainingById as Mock).mockResolvedValue({
      id: 't1',
      name: 'Training Test',
      exercices: [{ id: 'e1', name: 'Ex 1' }],
      ctime: new Date(),
      mtime: new Date(),
    })

    // Monter en utilisant le pinia pré-configuré
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

    // Émettre update:modelValue depuis l'instance du composant
    tf.vm.$emit('update:modelValue', 'New Name')

    // Vérifier si l'action de sauvegarde du store est appelée lors du clic sur enregistrer
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Enregistrer'))
    if (saveBtn) {
      await saveBtn.trigger('click')
      // Vérifier saveTraining, pas updateTraining
      expect(store.saveTraining).toHaveBeenCalled()
      const callArgs = (store.saveTraining as Mock).mock.calls[0][0]
      expect(callArgs.name).toBe('New Name')
    }
  })

  it("gère l'ajout d'exercices", async () => {
    await flushPromises()

    // Ouvrir le dialogue
    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Ajouter un exercice'))
    await addBtn?.trigger('click')

    expect((wrapper.vm as unknown as TrainingPageInstance).dialog).toBe(true)

    // Simuler la sélection dans le composant Exercices
    const exercicesComp = wrapper.findComponent({ name: 'Exercices' })
    expect(exercicesComp.exists()).toBe(true)

    const newExercices = [
      { id: 'e1', name: 'Ex 1' },
      { id: 'e2', name: 'Ex 2' },
    ]
    exercicesComp.vm.$emit('update:selected', newExercices)

    await flushPromises()

    // Vérifier que les exercices de l'entraînement sont mis à jour
    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices).toHaveLength(2)
    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices[1].id).toBe('e2')
  })

  it("gère la suppression d'un exercice", async () => {
    await flushPromises()

    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices).toHaveLength(1)

    // Trouver le bouton supprimer dans le menu
    // Le contenu du menu n'est généralement pas rendu tant qu'il n'est pas activé, mais le stub rend les slots.
    // v-menu stub: <div><slot /><slot name="activator" /></div>
    // Donc les éléments de liste devraient être visibles.

    const removeBtn = wrapper
      .findAll('.v-list-item-stub')
      .find((w) => w.text().includes('Supprimer'))
    expect(removeBtn?.exists()).toBe(true)

    await removeBtn?.trigger('click')

    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices).toHaveLength(0)
  })

  it('gère le déplacement des exercices (Monter/Descendre)', async () => {
    await flushPromises()
    // Configurer 2 ex avec les propriétés minimales requises
    const ex1 = {
      id: 'e1',
      name: 'Ex 1',
      hasEquipment: false,
      icon: 'icon',
      difficulty: 'débutant',
      instructions: 'inst',
    }
    const ex2 = {
      id: 'e2',
      name: 'Ex 2',
      hasEquipment: false,
      icon: 'icon',
      difficulty: 'débutant',
      instructions: 'inst',
    }

    // Utiliser le casting partiel ou satisfaire le type pour éviter 'any'
    ;(wrapper.vm as unknown as TrainingPageInstance).training.exercices = [
      ex1 as unknown as Exercice,
      ex2 as unknown as Exercice,
    ]
    await wrapper.vm.$nextTick()

    // Déclencher moveUp directement sur la VM pour éviter les problèmes de déclenchement UI
    ;(wrapper.vm as unknown as TrainingPageInstance).moveUp(1)
    await wrapper.vm.$nextTick()

    // Vérifier l'ordre
    const training = (wrapper.vm as unknown as TrainingPageInstance).training
    expect(training.exercices[0].id).toBe('e2')
    expect(training.exercices[1].id).toBe('e1')
  })

  it("met à jour l'ordre via draggable", async () => {
    await flushPromises()
    const draggable = wrapper.findComponent({ name: 'draggable' })
    const newOrder = [
      { id: 'e2', name: 'Ex 2' },
      { id: 'e1', name: 'Ex 1' },
    ]

    draggable.vm.$emit('update:modelValue', newOrder)

    await wrapper.vm.$nextTick()
    expect((wrapper.vm as unknown as TrainingPageInstance).training.exercices[0].id).toBe('e2')
  })

  it("gère l'erreur de chargement", async () => {
    ;(store.getTrainingById as Mock).mockRejectedValue(new Error('Load failed'))

    // Remonter pour déclencher onMounted
    const pinia = createTestingPinia({ createSpy: vi.fn })
    store = useTrainingStore(pinia)
    ;(store.getTrainingById as Mock).mockRejectedValue(new Error('Load failed'))

    wrapper = mount(TrainingPage, {
      global: { plugins: [pinia], stubs: { 'v-progress-circular': true, draggable: true } },
    })

    await flushPromises()
    // Validation : isLoading devrait être false finalement, et peut-être une erreur affichée ?
    // Le composant met isLoading à false dans finally.
    // Il ne semble pas afficher de message d'erreur dans l'UI d'après l'analyse du code, arrête juste le chargement.
    // On vérifie que le spinner de chargement a disparu.
    // On vérifie que le spinner de chargement a disparu et que l'erreur est présente
    const progress = wrapper.find('v-progress-circular')
    expect(progress.exists()).toBe(false)
    expect(wrapper.text()).toContain('Erreur lors du chargement')
  })
})
