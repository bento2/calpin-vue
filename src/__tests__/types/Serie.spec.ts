import { describe, it, expect } from 'vitest'
import { SerieSchema } from '@/types/SerieSchema'

describe('SerieSchema', () => {
  it('devrait calculer total correctement', () => {
    const result = SerieSchema.parse({
      repetitions: 10,
      poids: 15,
      checked: true,
    })
    expect(result.total).toBe(150)
  })

  it('devrait retourner un total de 0 si poids ou répétitions manquants', () => {
    let result = SerieSchema.parse({
      repetitions: 10,
      checked: true,
    })
    expect(result.total).toBe(0)

    result = SerieSchema.parse({
      poids: 10,
      checked: true,
    })
    expect(result.total).toBe(0)
  })
})
