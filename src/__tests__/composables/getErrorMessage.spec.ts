import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '@/composables/getErrorMessage'

describe('getErrorMessage (composable)', () => {
  it("devrait retourner le message si l'erreur est une instance de Error", () => {
    const error = new Error('Something went wrong')
    expect(getErrorMessage(error)).toBe('Something went wrong')
  })

  it("devrait retourner la chaîne si l'erreur est une chaîne", () => {
    const error = 'An error string'
    expect(getErrorMessage(error)).toBe('An error string')
  })

  it("devrait retourner le message par défaut pour les types d'erreur inconnus", () => {
    const error = { some: 'object' }
    expect(getErrorMessage(error)).toBe('Une erreur inconnue est survenue')
  })

  it('devrait retourner le message par défaut pour null', () => {
    expect(getErrorMessage(null)).toBe('Une erreur inconnue est survenue')
  })

  it('devrait retourner le message par défaut pour undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Une erreur inconnue est survenue')
  })
})
