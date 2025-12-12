import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import ExerciceList from '@/components/ExerciceList.vue'
import ExerciceCard from '@/components/ExerciceCard.vue'
import type { Exercice } from '@/types/ExerciceSchema.ts'

// Mock the ExerciceUtils
// Mock de ExerciceUtils
vi.mock('@/services/ExerciceUtils.ts', () => {
  const mockExercices: Exercice[] = [
    {
      id: '1',
      name: 'Pompes',
      icon: '/icons/push-up.png',
      difficulty: 'débutant',
      hasEquipment: false,
    },
    {
      id: '2',
      name: 'Squats',
      icon: '/icons/squat.png',
      difficulty: 'débutant',
      hasEquipment: false,
    },
    {
      id: '3',
      name: 'Gainage',
      icon: '/icons/plank.png',
      difficulty: 'intermédiaire',
      hasEquipment: false,
    },
  ]

  return {
    ExerciceUtils: {
      getInstance: vi.fn(() => ({
        find: vi.fn(({ page = 0, filter = '' } = {}) => {
          // Pagination simple - retourne 2 items par page
          const start = page * 2
          const filtered = mockExercices.filter((ex) =>
            ex.name.toLowerCase().includes(filter.toLowerCase()),
          )
          return filtered.slice(start, start + 2)
        }),
      })),
    },
  }
})

describe('Composant ExerciceList', () => {
  const createWrapper = (props = {}) => {
    return mount(ExerciceList, {
      props: {
        selectable: false,
        selected: [],
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
        ],
        stubs: {
          'v-infinite-scroll': {
            template: '<div><slot :done="() => {}" /></div>',
            methods: {
              reset: vi.fn(),
            },
          },
          'v-text-field': {
            template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
          },
          'v-checkbox': {
            template:
              '<input type="checkbox" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue'],
          },
          'v-icon': true,
          'v-row': true,
          'v-col': true,
          'v-container': true,
          VCard: {
            template: '<div class="v-card"><slot /></div>',
          },
          'v-card': {
            template: '<div class="v-card"><slot /></div>',
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot /></div>',
          },
          'v-card-actions': {
            template: '<div class="v-card-actions"><slot /></div>',
          },
          // ...

          'v-btn': true,
          'v-dialog': true,
          'v-toolbar': true,
          'v-toolbar-title': true,
          'v-divider': true,
          'v-card-title': true,
          'v-card-subtitle': true,
          'v-spacer': true,
        },
      },
    })
  }

  it('affiche le composant', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('charge les exercices au montage', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const exerciceCards = wrapper.findAllComponents(ExerciceCard)
    expect(exerciceCards.length).toBe(2) // La première page a 2 items
  })

  it('filtre les exercices quand la recherche change', async () => {
    const wrapper = createWrapper()
    await nextTick()

    // Définit le filtre
    const searchInput = wrapper.find('input')
    await searchInput.setValue('pompes')

    // Attendre le debounce (si présent) ou le watch
    // Note: Le watch déclenche le reset de la scroll view
    await nextTick()

    // Simuler le rechargement via infinite scroll reset (si implémenté dans le composant réel via ref)
    // Mais ici le stub est simple. On vérifie que le mock find est appelé avec le filtre

    // Pour tester le debounce/watch effectif, on devrait mocker timers si nécessaire.
    // Le composant utilise watch(filter), qui appelle utils.find

    // Attendre que le watch effectue son travail
    await nextTick()

    // Comme le stub v-infinite-scroll ne déclenche pas automatiquement le load au reset,
    // on doit vérifier l'état interne ou l'appel au service si possible,
    // ou manuellement trigger le load si exposé.

    // Ici on vérifie simplement que le mock a été appelé (si possible) ou on se fie au rendu
    // si le watch met à jour `exercices`.

    // La logique du composant : watch filter -> reset infiniteScroll -> page=0 -> exercices = utils.find()

    const exerciceCards = wrapper.findAllComponents(ExerciceCard)
    // "Pompes" match 1 item.
    expect(exerciceCards.length).toBe(1)
    expect(exerciceCards[0].props('exercice').name).toBe('Pompes')
  })

  it('émet update:selected quand un exercice est sélectionné en mode sélectionnable', async () => {
    const wrapper = createWrapper({ selectable: true })
    await nextTick()

    // Trouve le checkbox stub
    // Comme v-checkbox est stubbé, on peut chercher directement l'input dans le DOM si le stub est rendu
    // Mais si findComponent a échoué, c'est que v-checkbox n'est pas trouvé.
    // Vérifions si le composant ExerciceCard rend bien le slot actions.
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)

    expect(wrapper.emitted('update:selected')).toBeTruthy()
    const emitted = wrapper.emitted('update:selected') as any[][]
    expect(emitted[0][0]).toHaveLength(1)
    expect(emitted[0][0][0].id).toBe('1') // ID du premier exercice
  })
})
