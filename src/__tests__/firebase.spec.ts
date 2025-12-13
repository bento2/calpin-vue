import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('firebase.ts', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    // Mocker les variables d'environnement
    vi.stubGlobal('import.meta', {
      env: {
        VITE_FIREBASE_API_KEY: 'test-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test-domain',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket',
        VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender',
        VITE_FIREBASE_APP_ID: 'test-app',
        VITE_FIREBASE_MEASUREMENT_ID: 'test-measurement',
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('initialise firebase correctement', async () => {
    const initializeApp = vi.fn(() => ({}))
    const getAuth = vi.fn(() => ({}))
    const GoogleAuthProvider = vi.fn()
    const getFirestore = vi.fn(() => ({}))
    const enableIndexedDbPersistence = vi.fn().mockResolvedValue(undefined)

    vi.doMock('firebase/app', () => ({ initializeApp }))
    vi.doMock('firebase/auth', () => ({ getAuth, GoogleAuthProvider }))
    vi.doMock('firebase/firestore', () => ({ getFirestore, enableIndexedDbPersistence }))

    await import('@/firebase')

    expect(initializeApp).toHaveBeenCalled()
    expect(getAuth).toHaveBeenCalled()
    expect(getFirestore).toHaveBeenCalled()
    expect(enableIndexedDbPersistence).toHaveBeenCalled()
  })

  it("gère l'erreur failed-precondition", async () => {
    const enableIndexedDbPersistence = vi.fn().mockRejectedValue({ code: 'failed-precondition' })
    vi.doMock('firebase/firestore', () => ({
      getFirestore: vi.fn(),
      enableIndexedDbPersistence,
    }))
    // Les autres doivent être mockés pour éviter les erreurs lors de l'import
    vi.doMock('firebase/app', () => ({ initializeApp: vi.fn() }))
    vi.doMock('firebase/auth', () => ({ getAuth: vi.fn(), GoogleAuthProvider: vi.fn() }))

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await import('@/firebase')

    // Attendre la gestion du rejet de promesse (le catch est asynchrone)
    await new Promise((r) => setTimeout(r, 10))

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Multiple tabs open'))
  })

  it("gère l'erreur unimplemented", async () => {
    const enableIndexedDbPersistence = vi.fn().mockRejectedValue({ code: 'unimplemented' })
    vi.doMock('firebase/firestore', () => ({
      getFirestore: vi.fn(),
      enableIndexedDbPersistence,
    }))
    vi.doMock('firebase/app', () => ({ initializeApp: vi.fn() }))
    vi.doMock('firebase/auth', () => ({ getAuth: vi.fn(), GoogleAuthProvider: vi.fn() }))

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await import('@/firebase')

    await new Promise((r) => setTimeout(r, 10))

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Browser not supported'))
  })
})
