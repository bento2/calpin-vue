import { beforeEach, describe, expect, it } from 'vitest'
import { ExerciceUtils } from '@/services/ExerciceUtils.ts'
import { ExerciceArraySchema, ExerciceSchema } from '@/types/ExerciceSchema.ts'
type Item = { id: string; name: string }
function arraysAreDisjointById(a: Item[], b: Item[]) {
  return a.every((itemA) => !b.some((itemB) => itemB.id === itemA.id))
}

describe('Fonctions de test ExerciceUtils', () => {
  let util: ExerciceUtils
  beforeEach(async () => {
    util = ExerciceUtils.getInstance()
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
    const exercicesPage1 = util.find({ page: 1 })
    const exercicesPage2 = util.find({ page: 2 })
    expect(exercicesPage2.length).equals(10) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercicesPage1)).not.toThrow()
    expect(() => ExerciceArraySchema.parse(exercicesPage2)).not.toThrow()
    expect(arraysAreDisjointById(exercicesPage1, exercicesPage2)).toBe(true)
  })

  it('find avec filtre devrait retourner un tableau filtré', () => {
    const exercices = util.find({ filter: 'squat' })
    expect(exercices.length).greaterThan(5) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })
})
