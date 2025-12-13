import { describe, it, expect } from 'vitest'
import { dateWithDefault, TrainingSchema } from '@/types/TrainingSchema'
import { Timestamp } from 'firebase/firestore'

describe('TrainingSchema', () => {
  describe('dateWithDefault', () => {
    const schema = dateWithDefault()

    it('devrait retourner la date actuelle pour undefined', () => {
      const result = schema.parse(undefined)
      expect(result).toBeInstanceOf(Date)
      // Vérifier si c'est proche de maintenant (à 1 seconde près)
      expect(result.getTime()).toBeGreaterThan(Date.now() - 1000)
    })

    it('devrait parser une date string', () => {
      const dateStr = '2023-01-01T12:00:00.000Z'
      const result = schema.parse(dateStr)
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe(dateStr)
    })

    it('devrait parser un Timestamp Firestore', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      const timestamp = Timestamp.fromDate(date)
      const result = schema.parse(timestamp)
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe(date.toISOString())
    })

    it('devrait parser le format JSON Firestore', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      const seconds = Math.floor(date.getTime() / 1000)
      const nanoseconds = (date.getTime() % 1000) * 1000000

      const json = {
        type: 'firestore/timestamp/1.0',
        seconds,
        nanoseconds,
      }

      const result = schema.parse(json)
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe(date.toISOString())
    })

    it("devrait retourner l'objet Date tel quel", () => {
      const date = new Date()
      const result = schema.parse(date)
      expect(result).toBe(date)
    })
  })

  describe('TrainingSchema', () => {
    it('devrait parser un entrainement valide', () => {
      const validTraining = {
        id: '1',
        name: 'Training 1',
        exercices: [],
        ctime: new Date(),
        mtime: new Date(),
      }
      expect(() => TrainingSchema.parse(validTraining)).not.toThrow()
    })
  })
})
