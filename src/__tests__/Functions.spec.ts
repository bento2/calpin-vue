import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../composables/Functions'

describe('Functions', () => {
  describe('getErrorMessage', () => {
    it('should return the message if error is an instance of Error', () => {
      const error = new Error('Something went wrong')
      expect(getErrorMessage(error)).toBe('Something went wrong')
    })

    it('should return the string if error is a string', () => {
      const error = 'An error string'
      expect(getErrorMessage(error)).toBe('An error string')
    })

    it('should return default message for unknown error types', () => {
      const error = { some: 'object' }
      expect(getErrorMessage(error)).toBe('Une erreur inconnue est survenue')
    })

    it('should return default message for null', () => {
      expect(getErrorMessage(null)).toBe('Une erreur inconnue est survenue')
    })

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('Une erreur inconnue est survenue')
    })
  })
})
