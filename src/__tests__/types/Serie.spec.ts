import { describe, it, expect } from 'vitest'
import { SerieSchema } from '@/types/SerieSchema'

describe('SerieSchema', () => {
  it('should calculate total correctly', () => {
    const result = SerieSchema.parse({
      repetitions: 10,
      poids: 15,
      checked: true,
    })
    expect(result.total).toBe(150)
  })

  it('should return 0 total if poids or repetitions missing', () => {
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
