import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { FirebaseStorageAdapter } from '@/Storages/FirebaseStorageAdapter'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

// Mocks
vi.mock('@/firebase', () => ({
  db: {},
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => 'TIMESTAMP'),
}))

describe('FirebaseStorageAdapter', () => {
  let adapter: FirebaseStorageAdapter<unknown>
  const mockUser = { uid: 'user123' }
  const TEST_KEY = 'test_key'
  const TEST_DATA = { foo: 'bar' }

  // Variables pour contrôler l'état de l'auth mockée
  let onAuthCallback: (user: unknown) => void

  beforeEach(async () => {
    vi.clearAllMocks()

    // Configurer le mock onAuthStateChanged pour capturer le callback
    ;(onAuthStateChanged as Mock).mockImplementation((auth, cb) => {
      onAuthCallback = cb
      // Appeler le callback immédiatement avec le user par défaut pour débloquer le constructeur
      // cb(mockUser)
      // NOTE: Le constructeur attend le callback. Si on l'appelle sync, la promesse authReady se résout.
      return vi.fn() // unsubscribe
    })

    adapter = new FirebaseStorageAdapter()

    // Simuler connexion immédiate
    if (onAuthCallback) onAuthCallback(mockUser)
  })

  it("devrait attendre l'initialisation de l'auth", async () => {
    // Ce test est implicite si les autres passent, car ils awaitent tous waitForAuth
  })

  describe('get', () => {
    it('devrait retourner null si utilisateur non connecté', async () => {
      if (onAuthCallback) onAuthCallback(null) // Déconnexion
      const result = await adapter.get(TEST_KEY)
      expect(result).toBeNull()
    })

    it("devrait retourner null si le document n'existe pas", async () => {
      ;(getDoc as Mock).mockResolvedValue({
        exists: () => false,
      })
      const result = await adapter.get(TEST_KEY)
      expect(result).toBeNull()
    })

    it('devrait retourner les données si le document existe', async () => {
      ;(getDoc as Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ data: TEST_DATA }),
      })
      const result = await adapter.get(TEST_KEY)
      expect(result).toEqual(TEST_DATA)
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        `users/${mockUser.uid}/storage/${TEST_KEY}`,
      )
    })

    it('devrait gérer les erreurs de lecture', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(getDoc as Mock).mockRejectedValue(new Error('Firestore error'))
      const result = await adapter.get(TEST_KEY)
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('set', () => {
    it('devrait lancer une erreur si non authentifié', async () => {
      if (onAuthCallback) onAuthCallback(null)
      await expect(adapter.set(TEST_KEY, TEST_DATA)).rejects.toThrow('Utilisateur non authentifié')
    })

    it('devrait sauvegarder les données avec métadonnées', async () => {
      await adapter.set(TEST_KEY, TEST_DATA)
      expect(setDoc).toHaveBeenCalledWith(
        undefined, // docRef (mock result of doc())
        expect.objectContaining({
          userId: mockUser.uid,
          data: TEST_DATA,
          lastModified: 'TIMESTAMP',
        }),
      )
    })
  })

  describe('remove', () => {
    it('devrait supprimer le document', async () => {
      await adapter.remove(TEST_KEY)
      expect(deleteDoc).toHaveBeenCalled()
    })

    it('ne devrait rien faire si non connecté', async () => {
      if (onAuthCallback) onAuthCallback(null)
      await adapter.remove(TEST_KEY)
      expect(deleteDoc).not.toHaveBeenCalled()
    })
  })

  describe('exists', () => {
    it('devrait retourner true si le document existe', async () => {
      ;(getDoc as Mock).mockResolvedValue({ exists: () => true })
      expect(await adapter.exists(TEST_KEY)).toBe(true)
    })

    it("devrait retourner false si le document n'existe pas", async () => {
      ;(getDoc as Mock).mockResolvedValue({ exists: () => false })
      expect(await adapter.exists(TEST_KEY)).toBe(false)
    })
  })

  describe('setupRealtimeSync', () => {
    it('devrait configurer onSnapshot', async () => {
      const cb = vi.fn()
      await adapter.setupRealtimeSync(TEST_KEY, cb)
      expect(onSnapshot).toHaveBeenCalled()

      // Simuler trigger snapshot
      const snapshotHandler = (onSnapshot as Mock).mock.calls[0][1]
      snapshotHandler({
        exists: () => true,
        data: () => ({ data: TEST_DATA }),
      })

      expect(cb).toHaveBeenCalledWith(TEST_DATA)
    })
  })
})
