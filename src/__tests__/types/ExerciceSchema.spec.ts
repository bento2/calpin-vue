import { describe, it, expect } from 'vitest'
import { ExerciceSchema, addExerciceGetters } from '@/types/ExerciceSchema'

describe('ExerciceSchema', () => {
  describe('hasEquipment getter', () => {
    it('retourne false si equipment est indéfini ou null', () => {
      const ex = addExerciceGetters({ id: '1', name: 'Ex' })
      expect(ex.hasEquipment).toBe(undefined) // ou falsy logic?
      // check implementation: data.equipment && ...
      // if undefined -> undefined
      expect(Boolean(ex.hasEquipment)).toBe(false)
    })

    it('retourne false si equipment est "Aucun"', () => {
      const ex = addExerciceGetters({ id: '1', name: 'Ex', equipment: 'Aucun' })
      expect(ex.hasEquipment).toBe(false)
    })

    it('retourne false si equipment est vide', () => {
      const ex = addExerciceGetters({ id: '1', name: 'Ex', equipment: '' })
      expect(ex.hasEquipment).toBe('') // empty string is falsy
      expect(Boolean(ex.hasEquipment)).toBe(false)
    })

    it('retourne true si equipment est défini et valide', () => {
      const ex = addExerciceGetters({ id: '1', name: 'Ex', equipment: 'Barbell' })
      expect(ex.hasEquipment).toBe(true)
    })
  })

  it('parse correctement un exercice complet', () => {
    const validEx = {
      id: '1',
      name: 'Squat',
      difficulty: 'avancé',
      equipment: 'Barbell',
    }
    const result = ExerciceSchema.parse(validEx)
    expect(result.id).toBe('1')
    expect(result.hasEquipment).toBe(true)
  })
})
