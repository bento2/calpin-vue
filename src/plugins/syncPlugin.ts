import type { PiniaPluginContext, Store } from 'pinia'
import { StorageService } from '@/services/StorageService'
import type { Session } from '@/types/SessionSchema'
import type { Training } from '@/types/TrainingSchema'

type SyncConfig<T> = {
  storageName: string
  actionsToPush: string[]
  actionsToPull: string[]
  getTimestamp: (item: T) => number
  sort: (a: T, b: T) => number
}

type SyncStore<T> = Store & {
  items: T[]
  syncFromCloud?(): Promise<void>
  ensureLoaded(): Promise<void>
  persistItems?(): Promise<void>
}

export function setupSync<T extends { id: string }>(store: Store, config: SyncConfig<T>) {
  // 1. Initialisation du service de stockage Firebase
  const firebaseStorage = new StorageService<T[]>(config.storageName, {
    adapter: 'firebase',
  })

  // Debounce simple pour éviter de spammer Firebase
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const debouncedSave = (items: T[]) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      try {
        // On passe une copie pour éviter les problèmes de mutation pendant la sauvegarde
        await firebaseStorage.save(JSON.parse(JSON.stringify(items)))
        console.log(`[Sync ${config.storageName}] Sauvegarde cloud effectuée`)
      } catch (e) {
        console.error(`[Sync ${config.storageName}] Erreur sauvegarde cloud:`, e)
      }
    }, 2000) // 2 secondes de délai
  }

  // 2. Interception des actions
  store.$onAction(({ name, store: s, after }) => {
    if (config.actionsToPush.includes(name)) {
      after(() => {
        const items = s.items as T[]
        if (items) {
          debouncedSave(items)
        }
      })
    }

    if (config.actionsToPull.includes(name)) {
      after(() => {
        if (typeof s.syncFromCloud === 'function') {
          s.syncFromCloud()
        }
      })
    }
  })

  // 3. Logique de synchronisation descendante (Cloud -> Local)
  // @ts-expect-error - Dynamic addition of method
  store.syncFromCloud = async () => {
    try {
      console.log(`[Sync ${config.storageName}] Vérification des données distantes...`)
      const remoteItems = await firebaseStorage.load()

      if (remoteItems) {
        // Cast store once for cleaner usage
        const s = store as SyncStore<T>

        await s.ensureLoaded()
        const localItems = s.items as T[]

        if (!localItems) return

        const localMap = new Map(localItems.map((s) => [s.id, s]))
        let hasChanges = false

        remoteItems.forEach((remoteItem) => {
          const localItem = localMap.get(remoteItem.id)
          if (!localItem) {
            // Nouveau sur le cloud
            console.log(`[Sync ${config.storageName}] Ajout distant: ${remoteItem.id}`)
            localItems.push(remoteItem)
            hasChanges = true
          } else {
            // Conflit potentiel
            const remoteDate = config.getTimestamp(remoteItem)
            const localDate = config.getTimestamp(localItem)

            if (remoteDate > localDate) {
              console.log(`[Sync ${config.storageName}] Mise à jour locale pour ${remoteItem.id}`)
              const index = localItems.findIndex((s) => s.id === remoteItem.id)
              if (index !== -1) {
                localItems[index] = remoteItem
                hasChanges = true
              }
            }
          }
        })

        if (hasChanges) {
          // Tri
          localItems.sort(config.sort)
          // Persist localement
          // Persist localement
          if (s.persistItems) {
            await s.persistItems()
          }
          console.log(`[Sync ${config.storageName}] Synchronisation terminée avec succès`)
        } else {
          console.log(`[Sync ${config.storageName}] Données locales déjà à jour`)
        }
      }
    } catch (e) {
      console.error(`[Sync ${config.storageName}] Erreur syncFromCloud:`, e)
    }
  }
}

export function syncPlugin({ store }: PiniaPluginContext) {
  // console.log('Plugin initializing for store:', store.$id)

  if (store.$id === 'sessions') {
    setupSync<Session>(store, {
      storageName: 'sessions',
      actionsToPush: [
        'createSession',
        'updateSession',
        'finishSession',
        'saveSession',
        'deleteSession',
        'restartSession',
      ],
      actionsToPull: ['getSessions', 'loadSessions'],
      getTimestamp: (s) => {
        if (s.updatedAt) return new Date(s.updatedAt).getTime()
        if (s.dateFin) return new Date(s.dateFin).getTime()
        return new Date(s.dateDebut).getTime()
      },
      sort: (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
    })
  }

  if (store.$id === 'trainings') {
    setupSync<Training>(store, {
      storageName: 'trainings',
      actionsToPush: ['createTraining', 'saveTraining', 'deleteTrainingById'],
      actionsToPull: ['getTrainings', 'loadTrainings'],
      getTimestamp: (t) => new Date(t.mtime).getTime(),
      sort: (a, b) => new Date(b.ctime).getTime() - new Date(a.ctime).getTime(),
    })
  }
}
