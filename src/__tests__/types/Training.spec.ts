import { describe, it, expect } from 'vitest'
import { dateWithDefault, TrainingSchema } from '@/types/TrainingSchema'
import { Timestamp } from 'firebase/firestore'

describe('TrainingSchema', () => {
  describe('dateWithDefault', () => {
    const schema = dateWithDefault()

    it('should return current date for undefined', () => {
      const result = schema.parse(undefined)
      expect(result).toBeInstanceOf(Date)
      // Check if it's close to now (within 1 second)
      expect(result.getTime()).toBeGreaterThan(Date.now() - 1000)
    })

    it('should parse string date', () => {
      const dateStr = '2023-01-01T12:00:00.000Z'
      const result = schema.parse(dateStr)
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe(dateStr)
    })

    it('should parse Firestore Timestamp', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      const timestamp = Timestamp.fromDate(date)
      const result = schema.parse(timestamp)
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe(date.toISOString())
    })

    it('should parse Firestore JSON format', () => {
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

    it('should return Date object as is', () => {
      const date = new Date()
      const result = schema.parse(date)
      expect(result).toBe(date)
    })
  })

  describe('TrainingSchema', () => {
    it('should parse valid training', () => {
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
