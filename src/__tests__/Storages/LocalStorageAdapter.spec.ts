import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStorageAdapter } from '@/Storages/LocalStorageAdapter'

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter<any>
  const TEST_KEY = 'test_key'
  const TEST_VALUE = { foo: 'bar' }

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageAdapter()
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it("devrait retourner null si la clé n'existe pas", async () => {
      const result = await adapter.get('non_existent')
      expect(result).toBeNull()
    })

    it('devrait retourner la valeur parsée si la clé existe', async () => {
      localStorage.setItem(TEST_KEY, JSON.stringify(TEST_VALUE))
      const result = await adapter.get(TEST_KEY)
      expect(result).toEqual(TEST_VALUE)
    })

    it('devrait gérer les erreurs de parsing JSON', async () => {
      // Mock console.error to keep output clean
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorage.setItem(TEST_KEY, '{ invalid json')

      // The implementation catches error and returns null?
      // Let's verify source: "return data ? JSON.parse(data) : null" inside try, catch returns null.
      // Wait, JSON.parse throws.
      const result = await adapter.get(TEST_KEY)
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('set', () => {
    it('devrait sauvegarder la valeur stringifiée', async () => {
      await adapter.set(TEST_KEY, TEST_VALUE)
      const stored = localStorage.getItem(TEST_KEY)
      expect(stored).toBe(JSON.stringify(TEST_VALUE))
    })

    it("devrait lancer une erreur en cas d'échec du setItem", async () => {
      const errorSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })

      await expect(adapter.set(TEST_KEY, TEST_VALUE)).rejects.toThrow('Erreur localStorage.set')
    })
  })

  describe('remove', () => {
    it('devrait supprimer la clé', async () => {
      localStorage.setItem(TEST_KEY, 'some val')
      await adapter.remove(TEST_KEY)
      expect(localStorage.getItem(TEST_KEY)).toBeNull()
    })
  })

  describe('clear', () => {
    it('devrait vider le localStorage', async () => {
      localStorage.setItem('k1', 'v1')
      localStorage.setItem('k2', 'v2')
      await adapter.clear()
      expect(localStorage.length).toBe(0)
    })
  })

  describe('exists', () => {
    it('devrait retourner true si la clé existe', async () => {
      localStorage.setItem(TEST_KEY, 'v')
      expect(await adapter.exists(TEST_KEY)).toBe(true)
    })

    it("devrait retourner false si la clé n'existe pas", async () => {
      expect(await adapter.exists('nope')).toBe(false)
    })
  })
})
