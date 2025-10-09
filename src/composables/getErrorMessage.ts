import { ref, type Ref, onMounted, onUnmounted, watch } from 'vue'

import type { Session } from '@/types/SessionSchema.ts'
import { forHumans } from '@/composables/forHumans.ts'

/**
 * @param session Ref<{ dateDebut: Date } | null>
 */
export function getErrorMessage(
  session: Ref<Session | null>,

) {
  const diff = ref<string>('') // valeur formatée
  let intervalId: ReturnType<typeof setInterval> | null = null

  const updateDiff = () => {
    if (session.value!==null && session.value.dateDebut) {
      const seconds = Math.floor((Date.now() - session.value.dateDebut.getTime()) / 1000)
      diff.value = forHumans(seconds)
    }
  }

  onMounted(() => {
    updateDiff()
    intervalId = setInterval(updateDiff, 1000)
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })

  watch(session, updateDiff, { immediate: true })

  return { diff }
}
