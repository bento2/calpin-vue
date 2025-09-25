import { beforeEach, describe, expect, it } from 'vitest'
import { ExerciceUtils } from '@/services/ExerciceUtils.ts'
import { ExerciceArraySchema, ExerciceSchema } from '@/types/ExerciceSchema.ts'

function arraysAreDisjointById(a: Item[], b: Item[]) {
  return a.every((itemA) => !b.some((itemB) => itemB.id === itemA.id))
}

describe('ExerciceUtils test functions', () => {
  let util: ExerciceUtils
  beforeEach(async () => {
    util = new ExerciceUtils()
  })
  it('should be a function findById', () => {
    expect(typeof util.findById).toBe('function')
  })

  it('should findById to be a null return', () => {
    expect(util.findById('toto')).toBeNull()
  })

  it('should findById to be an Exercice', () => {
    const exercice = util.findById('bird_dog')
    expect(() => ExerciceSchema.parse(exercice)).not.toThrow()
  })

  it('should be a function all', () => {
    expect(typeof util.all).toBe('function')
  })

  it('should all to be an array', () => {
    const exercices = util.all()
    expect(exercices.length).greaterThan(0)
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })

  it('should be a function find', () => {
    expect(typeof util.find).toBe('function')
  })

  it('should find to be an array', () => {
    const exercices = util.find()
    expect(exercices.length).equals(10) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })

  it('should find with new nb to be an array', () => {
    const exercices = util.find({ nb: 12 })
    expect(exercices.length).equals(12) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })

  it('should find with pagination to be an array', () => {
    const exercicesPage1 = util.find({ page: 1 })
    const exercicesPage2 = util.find({ page: 2 })
    expect(exercicesPage2.length).equals(10) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercicesPage1)).not.toThrow()
    expect(() => ExerciceArraySchema.parse(exercicesPage2)).not.toThrow()
    expect(arraysAreDisjointById(exercicesPage1, exercicesPage2)).toBe(true)
  })

  it('should find with filter to be an array', () => {
    const exercices = util.find({ filter: 'squat' })
    expect(exercices.length).greaterThan(5) //par défaut 10 exercices
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })
})
