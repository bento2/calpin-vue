import { describe, it, expect } from 'vitest'
import { SessionSchema } from '@/types/SessionSchema'

describe('SessionSchema', () => {
  const baseSession = {
    id: '1',
    trainingId: 't1',
    status: 'en_cours',
    dateDebut: new Date(),
    exercices: [],
  }

  it('devrait calculer ended correctement', () => {
    // Pas d'exercices
    let result = SessionSchema.parse(baseSession)
    expect(result.ended).toBe(false)

    // Exercice non terminé
    result = SessionSchema.parse({
      ...baseSession,
      exercices: [
        {
          id: 'e1',
          name: 'Ex 1',
          series: [{ checked: false, repetitions: 10, poids: 10 }],
        },
      ],
    })
    expect(result.ended).toBe(false)

    // Exercice terminé
    result = SessionSchema.parse({
      ...baseSession,
      exercices: [
        {
          id: 'e1',
          name: 'Ex 1',
          series: [{ checked: true, repetitions: 10, poids: 10 }],
        },
      ],
    })
    expect(result.ended).toBe(true)
  })

  it('devrait calculer nbChecked correctement', () => {
    const result = SessionSchema.parse({
      ...baseSession,
      exercices: [
        {
          id: 'e1',
          name: 'Ex 1',
          series: [{ checked: true, repetitions: 10, poids: 10 }], // Terminé
        },
        {
          id: 'e2',
          name: 'Ex 2',
          series: [{ checked: false, repetitions: 10, poids: 10 }], // Non terminé
        },
      ],
    })
    expect(result.nbChecked).toBe(1)
  })

  it('devrait calculer total correctement', () => {
    const result = SessionSchema.parse({
      ...baseSession,
      exercices: [
        {
          id: 'e1',
          name: 'Ex 1',
          series: [{ checked: true, repetitions: 10, poids: 10 }], // 100
        },
        {
          id: 'e2',
          name: 'Ex 2',
          series: [{ checked: true, repetitions: 5, poids: 20 }], // 100
        },
      ],
    })
    expect(result.total).toBe(200)
  })
})
