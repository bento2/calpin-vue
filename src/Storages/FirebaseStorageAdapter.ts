// FirebaseStorageAdapter.ts
import type { StorageAdapter } from '@/Storages/StorageAdapter'
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth'
import { db } from '@/firebase'

interface FirebaseData<T> {
  userId: string
  data: T
  lastModified: unknown
}

export class FirebaseStorageAdapter<T> implements StorageAdapter<T> {
  private db = db
  private auth = getAuth()
  private currentUser: User | null = null
  private authReady: Promise<void>
  private authUnsubscribe?: Unsubscribe

  constructor() {
    // Attendre que l'auth soit initialisée
    this.authReady = new Promise((resolve) => {
      this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user
        resolve()
      })
    })
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

  async get(key: string): Promise<T | null> {
    try {
      await this.waitForAuth()
      const userId = this.getUserId()
      if (!userId) return null

      const docRef = doc(this.db, this.getDocPath(key))
      // getDoc utilise le cache offline par défaut si activé
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const firebaseData = docSnap.data() as FirebaseData<T>
        return firebaseData.data
      }
      return null
    } catch (error) {
      console.error('Erreur get Firebase:', error)
      return null
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      await this.waitForAuth()
      const userId = this.getUserId()
      if (!userId) throw new Error('Utilisateur non authentifié')

      const docRef = doc(this.db, this.getDocPath(key))
      const dataToSend = {
        userId: userId,
        data: value,
        lastModified: serverTimestamp(),
      }

      // setDoc écrit dans le cache local immédiatement et synchronise quand possible
      await setDoc(docRef, dataToSend)
    } catch (error) {
      console.error('Erreur set Firebase:', error)
      throw error
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.waitForAuth()
      const userId = this.getUserId()
      if (!userId) return

      const docRef = doc(this.db, this.getDocPath(key))
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Erreur remove Firebase:', error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.waitForAuth()
      const userId = this.getUserId()
      if (!userId) return false

      const docRef = doc(this.db, this.getDocPath(key))
      const docSnap = await getDoc(docRef)
      return docSnap.exists()
    } catch (error) {
      console.error('Erreur exists Firebase:', error)
      return false
    }
  }

  async clear(): Promise<void> {
    // Note: On ne peut pas facilement "tout effacer" dans Firestore sans connaître toutes les clés
    // ou faire une requête de collection.
    // Pour l'instant, on laisse vide ou on implémente si nécessaire avec une collection.
    console.warn(
      'Clear non implémenté pour FirebaseStorageAdapter (nécessite une structure de collection)',
    )
  }

  async setupRealtimeSync(key: string, callback?: (data: T | null) => void): Promise<Unsubscribe> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) return () => {}

    const docRef = doc(this.db, this.getDocPath(key))

    // onSnapshot fonctionne aussi avec le cache offline
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const firebaseData = docSnap.data() as FirebaseData<T>
          if (callback) callback(firebaseData.data)
        } else {
          if (callback) callback(null)
        }
      },
      (error) => {
        console.error(`Erreur synchro temps réel [${key}]:`, error)
      },
    )
  }

  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe()
    }
  }
}
