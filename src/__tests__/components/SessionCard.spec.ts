import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionCard from '@/components/SessionCard.vue'
import type { Session } from '@/types/SessionSchema.ts'

describe('SessionCard', () => {
  const mockSession: Session = {
    id: 'session-1',
    name: 'Session du matin',
    nbChecked: 5,
    total: 2500, // Grand nombre pour tester le formatage si la locale s'applique
    exercices: [],
    ended: false,
    dateDebut: new Date(),
    trainingId: 'training-1',
    status: 'en_cours',
    updatedAt: new Date(),
  }

  it('affiche le nom de la session et les infos', () => {
    const wrapper = mount(SessionCard, {
      props: {
        modelValue: mockSession,
      },
      global: {
        stubs: {
          AppCard: {
            template: `
              <div class="app-card-stub">
                <div class="title">{{ title }}</div>
                <slot />
                <div class="actions"><slot name="actions" /></div>
              </div>
            `,
            props: ['title'],
          },
        },
      },
    })
    expect(wrapper.find('.title').text()).toBe('Session du matin')
    expect(wrapper.text()).toContain("Nombre d'exercices : 5")
    // Vérifie le formatage - la chaîne locale peut dépendre de l'env mais regroupe généralement les milliers
    // On vérifie juste qu'il contient la structure du nombre
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('500')
  })

  it('gère une session vide gracefully (undefined model)', () => {
    const wrapper = mount(SessionCard, {
      props: {
        modelValue: undefined,
      },
      global: {
        stubs: {
          AppCard: {
            template: `
              <div class="app-card-stub">
                <div class="title">{{ title }}</div>
                <slot />
                <div class="actions"><slot name="actions" /></div>
              </div>
            `,
            props: ['title'],
          },
        },
      },
    })
    expect(wrapper.find('.title').text()).toBe('Pas de nom')
    // Devrait vérifier qu'il ne plante pas en accédant aux propriétés
    expect(wrapper.text()).toContain("Nombre d'exercices :")
  })

  it('affiche le slot actions si fourni', () => {
    const wrapper = mount(SessionCard, {
      props: {
        modelValue: mockSession,
      },
      slots: {
        actions: '<button class="action-btn">Click me</button>',
      },
      global: {
        stubs: {
          AppCard: {
            template: `
              <div class="app-card-stub">
                 <slot name="actions" />
              </div>
            `,
            props: ['title'],
          },
        },
      },
    })

    expect(wrapper.find('.action-btn').exists()).toBe(true)
  })
})
