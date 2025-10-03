// FirebaseStorageAdapter.ts
import type { StorageAdapter } from '@/Storages/StorageAdapter'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth'

interface FirebaseData<T> {
  userId: string
  data: T
  lastModified: unknown // serverTimestamp ou Date
}

export class FirebaseStorageAdapter<T> implements StorageAdapter<T> {
  private db = getFirestore()
  private auth = getAuth()
  private currentUser: User | null = null
  private authReady: Promise<void>
  private unsubscribeCallbacks: Map<string, Unsubscribe> = new Map()
  private localCache: Map<string, T> = new Map()
  private pendingWrites: Map<string, T> = new Map()
  private isOnline: boolean = navigator.onLine
  private authUnsubscribe?: Unsubscribe

  constructor() {
    // Attendre que l'auth soit initialisée
    this.authReady = new Promise((resolve) => {
      this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user

        if (!user) {
          // Vider le cache si l'utilisateur se déconnecte
          this.localCache.clear()
          this.pendingWrites.clear()
          this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
          this.unsubscribeCallbacks.clear()
        } else {
          // Charger les écritures en attente quand l'utilisateur se connecte
          this.loadPendingWrites()
          if (this.isOnline && this.pendingWrites.size > 0) {
            this.syncPendingWrites()
          }
        }

        resolve()
      })
    })

    // Écouter les changements de connexion
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  private async waitForAuth(): Promise<void> {
    await this.authReady
  }

  private getUserId(): string | null {
    return this.currentUser?.uid || null
  }

  private getDocPath(key: string): string {
    const userId = this.getUserId()
    if (!userId) throw new Error('Utilisateur non authentifié')
    return `users/${userId}/storage/${key}`
  }

  // GET - Récupérer avec fallback local
  async get(key: string): Promise<T | null> {
    try {
      await this.waitForAuth()

      const userId = this.getUserId()
      if (!userId) return this.getFromLocalStorage(key)

      // 1. Vérifier le cache local d'abord
      if (this.localCache.has(key)) {
        return this.localCache.get(key)!
      }

      // 2. Si hors ligne, utiliser localStorage
      if (!this.isOnline) {
        return this.getFromLocalStorage(key)
      }

      // 3. Récupérer depuis Firestore
      const docRef = doc(this.db, this.getDocPath(key))
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const firebaseData = docSnap.data() as FirebaseData<T>
        const data = firebaseData.data

        // Mettre à jour le cache
        this.localCache.set(key, data)
        this.saveToLocalStorage(key, data)

        return data
      }

      // 4. Si pas de données Firestore, vérifier localStorage
      return this.getFromLocalStorage(key)
    } catch (error) {
      console.error('Erreur get Firebase:', error)
      // Fallback sur localStorage en cas d'erreur
      return this.getFromLocalStorage(key)
    }
  }

  // SET - Sauvegarder avec synchro
  async set(key: string, value: T): Promise<void> {
    try {
      await this.waitForAuth()

      const userId = this.getUserId()
      if (!userId) {
        throw new Error('Utilisateur non authentifié')
      }

      // 1. Toujours sauvegarder en local d'abord (rapide)
      this.localCache.set(key, value)
      this.saveToLocalStorage(key, value)

      // 2. Si en ligne, sauvegarder sur Firestore
      if (this.isOnline) {
        await this.saveValue(key, value)
        console.log(`✅ [${key}] Synchronisé avec Firestore`)

        // Retirer des écritures en attente
        this.pendingWrites.delete(key)
        this.savePendingWrites()
      } else {
        // 3. Si hors ligne, ajouter à la file d'attente
        this.pendingWrites.set(key, value)
        this.savePendingWrites()
        console.log(`📝 [${key}] En attente de synchronisation`)
      }
    } catch (error) {
      console.error('Erreur set Firebase:', error)
      // Ajouter à la file d'attente en cas d'erreur
      this.pendingWrites.set(key, value)
      this.savePendingWrites()
    }
  }

  // REMOVE - Supprimer
  async remove(key: string): Promise<void> {
    try {
      await this.waitForAuth()

      const userId = this.getUserId()
      if (!userId) return

      // 1. Supprimer du cache
      this.localCache.delete(key)
      this.removeFromLocalStorage(key)

      // 2. Si en ligne, supprimer de Firestore
      if (this.isOnline) {
        const docRef = doc(this.db, this.getDocPath(key))
        await deleteDoc(docRef)
        console.log(`🗑️ [${key}] Supprimé de Firestore`)
      }

      // 3. Nettoyer la synchro temps réel
      const unsubscribe = this.unsubscribeCallbacks.get(key)
      if (unsubscribe) {
        unsubscribe()
        this.unsubscribeCallbacks.delete(key)
      }
    } catch (error) {
      console.error('Erreur remove Firebase:', error)
    }
  }

  // EXISTS - Vérifier l'existence
  async exists(key: string): Promise<boolean> {
    try {
      await this.waitForAuth()

      // Vérifier le cache d'abord
      if (this.localCache.has(key)) return true

      // Vérifier localStorage
      const localData = this.getFromLocalStorage(key)
      if (localData !== null) return true

      // Si en ligne, vérifier Firestore
      if (this.isOnline) {
        const userId = this.getUserId()
        if (!userId) return false

        const docRef = doc(this.db, this.getDocPath(key))
        const docSnap = await getDoc(docRef)
        return docSnap.exists()
      }

      return false
    } catch (error) {
      console.error('Erreur exists Firebase:', error)
      return false
    }
  }

  // CLEAR - Tout supprimer
  async clear(): Promise<void> {
    try {
      // Nettoyer le cache
      this.localCache.clear()

      // Nettoyer localStorage
      this.clearLocalStorage()

      // Nettoyer les souscriptions
      this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
      this.unsubscribeCallbacks.clear()

      console.log('🧹 Cache nettoyé')
    } catch (error) {
      console.error('Erreur clear Firebase:', error)
    }
  }

  // SYNCHRONISATION TEMPS RÉEL
  async setupRealtimeSync(key: string, callback?: (data: T | null) => void): Promise<Unsubscribe> {
    await this.waitForAuth()

    const userId = this.getUserId()
    if (!userId) {
      console.warn('Impossible de configurer la synchro: utilisateur non authentifié')
      return () => {}
    }

    // Nettoyer l'ancienne souscription si elle existe
    const existingUnsubscribe = this.unsubscribeCallbacks.get(key)
    if (existingUnsubscribe) {
      existingUnsubscribe()
    }

    // Créer la nouvelle souscription
    const docRef = doc(this.db, this.getDocPath(key))
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const firebaseData = docSnap.data() as FirebaseData<T>
          const data = firebaseData.data

          // Vérifier si les données ont changé
          const cachedData = this.localCache.get(key)
          if (JSON.stringify(cachedData) !== JSON.stringify(data)) {
            console.log(`🔄 [${key}] Mise à jour depuis Firestore`)

            // Mettre à jour le cache
            this.localCache.set(key, data)
            this.saveToLocalStorage(key, data)

            // Appeler le callback si fourni
            if (callback) {
              callback(data)
            }

            // Émettre un événement personnalisé
            window.dispatchEvent(
              new CustomEvent(`storage:${key}:updated`, {
                detail: data,
              }),
            )
          }
        } else {
          // Document supprimé
          this.localCache.delete(key)
          this.removeFromLocalStorage(key)

          if (callback) {
            callback(null)
          }

          window.dispatchEvent(new CustomEvent(`storage:${key}:deleted`))
        }
      },
      (error) => {
        console.error(`Erreur synchro temps réel [${key}]:`, error)
      },
    )

    this.unsubscribeCallbacks.set(key, unsubscribe)
    return unsubscribe
  }

  // Gérer le retour en ligne
  private async handleOnline() {
    console.log('🟢 Connexion rétablie')
    this.isOnline = true

    // Attendre que l'auth soit prête avant de synchroniser
    await this.waitForAuth()

    // Synchroniser les écritures en attente
    await this.syncPendingWrites()
  }

  // Gérer le passage hors ligne
  private handleOffline() {
    console.log('🔴 Connexion perdue - mode offline')
    this.isOnline = false
  }

  private async saveValue(key: string, value: unknown) {
    const userId = this.getUserId()
    const docRef = doc(this.db, this.getDocPath(key))

    // Convertir les timestamps avant l'envoi
    const dataToSend = {
      userId: userId,
      data: value,
      lastModified: serverTimestamp(),
    }

    return setDoc(docRef, dataToSend)
  }

  // Synchroniser les écritures en attente
  private async syncPendingWrites() {
    const userId = this.getUserId()
    if (!userId || this.pendingWrites.size === 0) return

    console.log(`🔄 Synchronisation de ${this.pendingWrites.size} écriture(s)`)

    const promises: Promise<void>[] = []

    this.pendingWrites.forEach((value, key) => {
      const promise = (async () => {
        try {
          await this.saveValue(key, value)

          console.log(`✅ [${key}] Synchronisé`)
          this.pendingWrites.delete(key)
        } catch (error) {
          console.error(`❌ [${key}] Erreur synchro:`, error)
        }
      })()

      promises.push(promise)
    })

    await Promise.allSettled(promises)
    this.savePendingWrites()
  }

  // HELPERS LOCALSTORAGE
  private getLocalStorageKey(key: string): string {
    return `firebase_cache_${key}`
  }

  private getFromLocalStorage(key: string): T | null {
    try {
      const data = localStorage.getItem(this.getLocalStorageKey(key))
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  private saveToLocalStorage(key: string, value: T): void {
    try {
      localStorage.setItem(this.getLocalStorageKey(key), JSON.stringify(value))
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error)
    }
  }

  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(this.getLocalStorageKey(key))
    } catch (error) {
      console.error('Erreur suppression localStorage:', error)
    }
  }

  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith('firebase_cache_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Erreur nettoyage localStorage:', error)
    }
  }

  private savePendingWrites(): void {
    try {
      const pending = Array.from(this.pendingWrites.entries())
      localStorage.setItem('firebase_pending_writes', JSON.stringify(pending))
    } catch (error) {
      console.error('Erreur sauvegarde pending writes:', error)
    }
  }

  private loadPendingWrites(): void {
    try {
      const data = localStorage.getItem('firebase_pending_writes')
      if (data) {
        const pending = JSON.parse(data)
        this.pendingWrites = new Map(pending)
      }
    } catch (error) {
      console.error('Erreur chargement pending writes:', error)
    }
  }

  // Nettoyer les ressources
  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe()
    }
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
    this.unsubscribeCallbacks.clear()
    window.removeEventListener('online', () => this.handleOnline())
    window.removeEventListener('offline', () => this.handleOffline())
  }
}
