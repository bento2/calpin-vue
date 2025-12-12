import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'
import { mockUser } from '../mocks/firebaseAuthVueUse'
import type { User } from 'firebase/auth'

// Mock des dépendances via vi.hoisted pour les fonctions firebase
const mocks = vi.hoisted(() => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

// On mocke useAuth en redirigeant vers notre fichier de mock réactif
vi.mock('@vueuse/firebase/useAuth', () => import('../mocks/firebaseAuthVueUse'))

vi.mock('firebase/auth', () => ({
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
  GoogleAuthProvider: vi.fn(),
  getAuth: vi.fn(),
}))

vi.mock('@/firebase', () => ({
  auth: {},
  googleProvider: {},
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockUser.value = null
    vi.clearAllMocks()
  })

  it('initialise avec un utilisateur null', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it("connecte l'utilisateur avec succès (appel firebase)", async () => {
    const store = useAuthStore()
    mocks.signInWithPopup.mockResolvedValueOnce({})
    await store.login()
    expect(mocks.signInWithPopup).toHaveBeenCalled()
  })

  it('gère les erreurs de connexion', async () => {
    const store = useAuthStore()
    const error = new Error('Auth failed')
    mocks.signInWithPopup.mockRejectedValueOnce(error)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await store.login()

    expect(mocks.signInWithPopup).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('Erreur login:', error)
  })

  it("déconnecte l'utilisateur avec succès", async () => {
    const store = useAuthStore()
    mocks.signOut.mockResolvedValueOnce({})
    await store.logout()
    expect(mocks.signOut).toHaveBeenCalled()
  })

  it('gère les erreurs de déconnexion', async () => {
    const store = useAuthStore()
    const error = new Error('Logout failed')
    mocks.signOut.mockRejectedValueOnce(error)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await store.logout()

    expect(mocks.signOut).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('Erreur logout:', error)
  })

  it('met à jour isAuthenticated quand user change', async () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)

    mockUser.value = { uid: '123', displayName: 'Test' } as unknown as User
    expect(store.isAuthenticated).toBe(true)

    mockUser.value = null
    expect(store.isAuthenticated).toBe(false)
  })
})
