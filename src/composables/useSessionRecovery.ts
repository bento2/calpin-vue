import { type Session, SessionSchema } from '@/types/SessionSchema'
import { watch, type Ref } from 'vue'

export function useSessionRecovery(session: Ref<Session | null>) {
  const saveLocal = (s: Session) => {
    localStorage.setItem(`calpin_session_${s.id}`, JSON.stringify(s))
  }

  const clearLocal = (id: string) => {
    localStorage.removeItem(`calpin_session_${id}`)
  }

  const recoverSession = (id: string): Session | undefined => {
    const local = localStorage.getItem(`calpin_session_${id}`)
    if (local) {
      try {
        return SessionSchema.parse(JSON.parse(local))
      } catch (e) {
        console.error('Erreur chargement local', e)
        return undefined
      }
    }
    return undefined
  }

  // Auto-save watcher
  watch(
    () => (session.value ? JSON.parse(JSON.stringify(session.value)) : null),
    (newValue) => {
      if (newValue) {
        saveLocal(newValue)
      }
    },
    { deep: true },
  )

  return {
    saveLocal,
    clearLocal,
    recoverSession,
  }
}
