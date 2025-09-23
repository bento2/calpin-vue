import { beforeEach, describe, expect, it } from 'vitest'
import { ExerciceUtils } from '@/services/ExerciceUtils.ts'
import { ExerciceArraySchema, ExerciceSchema } from '@/types/ExerciceSchema.ts'


describe('ExerciceUtils test functions', () => {
  let util: ExerciceUtils
  beforeEach(async () => {
    util = new ExerciceUtils()
  })
  it('should be a function getById', () => {
    expect(typeof util.getById).toBe('function')
  })

  it('should getById to be a null return', async () => {
    expect(await util.getById('toto')).toBeUndefined()
  })

  it('should getById to be an Exercice', async () => {
    const exercice = await util.getById('bird_dog')
    expect(() => ExerciceSchema.parse(exercice)).not.toThrow()
  })

  it('should be a function getAll', () => {
    expect(typeof util.getAll).toBe('function')
  })

  it('should getAll to be an array', async () => {
    const exercices = await util.getAll()
    expect(exercices.length).greaterThan(0)
    expect(() => ExerciceArraySchema.parse(exercices)).not.toThrow()
  })
})
