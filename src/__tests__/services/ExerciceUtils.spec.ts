import { beforeEach, describe, expect, it } from 'vitest'
import { ExerciceUtils } from '@/services/ExerciceUtils.ts'
import { ExerciceArraySchema, ExerciceSchema } from '@/types/ExerciceSchema.ts'

// Need to return data that matches ExerciceSchema to pass validation inside getInstance
// Since we are using dynamic import of real file, we rely on Vitest handling JSON import or we might need to mock import if we want isolated test.
// However, simplified approach: Let it load real JSON or mocks via vi.mock if needed.
// For now, removing complex fetch mocks.

type Item = { id: string; name: string }

function arraysAreDisjointById(a: Item[], b: Item[]) {
  return a.every((itemA) => !b.some((itemB) => itemB.id === itemA.id))
}

describe('Fonctions de test ExerciceUtils', () => {
  let util: ExerciceUtils
  beforeEach(async () => {
    // We assume getInstance works.
    util = await ExerciceUtils.getInstance()
  })
  it('findById devrait être une fonction', () => {
    expect(typeof util.findById).toBe('function')
  })

  it('findById devrait retourner null si non trouvé', () => {
    expect(util.findById('toto')).toBeNull()
  })

  it('findById devrait retourner un Exercice', () => {
    const exercice = util.findById('bird_dog')
    expect(() => ExerciceSchema.parse(exercice)).not.toThrow()
  })

  it('all devrait être une fonction', () => {
    expect(typeof util.all).toBe('function')
  })

  it('all devrait retourner un tableau', () => {
    const exercices = util.all()
    expect(exercices.length).greaterThan(0)
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })

  it('find devrait être une fonction', () => {
    expect(typeof util.find).toBe('function')
  })

  it('find devrait retourner un tableau', () => {
    const exercices = util.find()
    expect(exercices.length).equals(10) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })

  it('find avec paramètre nb devrait retourner le bon nombre', () => {
    const exercices = util.find({ nb: 12 })
    expect(exercices.length).equals(12) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })

  it('find avec pagination devrait retourner un tableau correct', () => {
    const exercicesPage1 = util.find({ page: 0 }) // 0-indexed logic in implementation?
    const exercicesPage2 = util.find({ page: 1 })
    expect(exercicesPage2.length).greaterThan(0)
    expect(() => ExerciceArraySchema.parse(exercicesPage1)).not.toThrow()
    expect(() => ExerciceArraySchema.parse(exercicesPage2)).not.toThrow()
    expect(arraysAreDisjointById(exercicesPage1, exercicesPage2)).toBe(true)
  })

  it('find avec filtre devrait retourner un tableau filtré', () => {
    // using mock data name "Bird Dog"
    const exercices = util.find({ filter: 'Bird' })
    expect(exercices.length).greaterThan(0)
    expect(exercices[0].name).toContain('Bird')
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })
})
