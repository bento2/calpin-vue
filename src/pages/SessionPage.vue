<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useSessionStore } from '@/stores/useSessionStore.ts'
import { useRoute, useRouter } from 'vue-router'
import { type Session } from '@/types/SessionSchema.ts'
import SessionExerciceItem from '@/components/SessionExerciceItem.vue'
import SeriesCard from '@/components/SeriesCard.vue'
import ExerciceList from '@/components/ExerciceList.vue'
import AppBtn from '@/components/ui/AppBtn.vue'
import SessionPauseDialog from '@/components/SessionPauseDialog.vue'
import { debounce } from 'lodash-es'

import { useSessionTimer } from '@/composables/useSessionTimer'
import { useSessionRecovery } from '@/composables/useSessionRecovery'

const session = ref<Session | null>(null)
const { recoverSession, saveLocal, clearLocal } = useSessionRecovery(session)

const {
  getSessionById,
  deleteSession,
  finishSession,
  restartSession,
  updateSession,
  saveSession,
} = useSessionStore()
const route = useRoute()
const router = useRouter()
const ended = computed(() => session.value?.ended ?? false)

onMounted(async () => {
  if (route.params.id) {
    const id = route.params.id as string
    let loadedSession: Session | undefined

    const localSession = recoverSession(id)
    if (localSession) {
      loadedSession = localSession
      // Sync local changes to store
      updateSession(loadedSession)
    }

    if (!loadedSession) {
      loadedSession = await getSessionById(id)
    }

    if (loadedSession) {
      session.value = loadedSession
    }
  }
})

const debouncedUpdate = debounce((value) => {
  updateSession(value)
}, 2000)

const menu = ref(false)
const timerDisplay = useSessionTimer(session)

watch(
  () => JSON.parse(JSON.stringify(session.value)),
  (newValue, oldValue) => {
    if (!newValue || !oldValue) return

    saveLocal(newValue)

    //on regarde si il y une serie de terminée
    if (newValue.nbChecked !== oldValue.nbChecked) {
      debouncedUpdate(newValue)
    }

    if (newValue?.ended) {
      // Session ended logic if needed
      debouncedUpdate(newValue)
    }
  },
  { deep: true },
)

const close = () => {
  menu.value = false
}

const cancel = () => {
  if (session.value !== null) {
    deleteSession(session.value.id)
    clearLocal(session.value.id)
  }
  goHome()
}

const remove = (id: string) => {
  if (!session.value?.exercices) return

  const index = session.value.exercices.findIndex((e) => e.id === id)
  if (index !== -1) {
    session.value.exercices.splice(index, 1)
  }
}

const moveDown = (index: number) => {
  return move(index, 1)
}

const moveUp = (index: number) => {
  return move(index, -1)
}

const move = (index: number, step: number) => {
  if (!session.value?.exercices) return
  const len = session.value.exercices.length

  if (step > 0 && index >= len - 1) return
  if (step < 0 && index <= 0) return

  const exercices = session.value.exercices
  const tmp = exercices[index]
  exercices[index] = exercices[index + step]
  exercices[index + step] = tmp
}


const goHome = () => {
  router.push({ name: 'Home' })
}

const restart = () => {
  if (session.value !== null) {
    restartSession(session.value)
  }
  close()
}

const save = () => {
  if (session.value !== null) {
    saveSession(session.value)
  }
  close()
}

const end = () => {
  if (session.value !== null) {
    finishSession(session.value.id)
    clearLocal(session.value.id)
  }
  goHome()
}

const openIndexes = ref<Set<number>>(new Set())

const toggle = (index: number) => {
  if (openIndexes.value.has(index)) {
    openIndexes.value.delete(index)
  } else {
    openIndexes.value.add(index)
  }
}

const isOpen = (index: number) => openIndexes.value.has(index)

const dialogExercices = ref(false)
</script>

<template>
  <div v-if="session === null" class="h-100 d-flex align-center justify-center">
    <v-progress-circular indeterminate></v-progress-circular>
  </div>
  <div v-else class="h-100 d-flex flex-column">
    <div class="pa-2 d-flex align-center justify-space-between text-white bg-blue-accent-2 elevation-2">
      <div class="text-h6 font-weight-bold">{{ session.name }}</div>
      <div class="text-h6 d-flex align-center">
        <!-- Timer component could be extracted too -->
        <div class="mr-4">{{ timerDisplay.diff }}</div>

        <AppBtn variant="icon" icon="mdi-pause" @click="menu = true" class="bg-white text-blue-accent-2" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="overflow-y-auto flex-grow-1 px-2 pt-2 pb-14 bg-blue-accent-4 mb-2">
      <template v-for="(exercice, index) in session.exercices" :key="exercice.id">
        <SessionExerciceItem :exercice="exercice" :index="index" :is-open="isOpen(index)"
          :is-last="index === session.exercices.length - 1" @move-up="moveUp" @move-down="moveDown" @remove="remove"
          @toggle="toggle" />
        <KeepAlive>
          <SeriesCard v-model="exercice.series" :exerciceId="exercice.id" v-if="openIndexes.has(index)" />
        </KeepAlive>
      </template>
    </div>

    <!-- Footer/Finish -->
    <div class="pa-2 bg-white border-t ga-2" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 10;">
      <AppBtn block size="large" @click="dialogExercices = !dialogExercices" :variant="ended ? 'secondary' : 'primary'"
        v-if='!ended'>
        Ajout un Exercice
      </AppBtn>
    </div>

    <!-- Pause Menu Dialog -->
    <SessionPauseDialog v-model="menu" :session="session" @restart="restart" @save="save" @end="end" @cancel="cancel" />
  </div>
  <v-dialog v-model="dialogExercices" transition="dialog-bottom-transition" class="w-90 p-4">
    <v-card v-if="session">
      <v-toolbar color="primary">
        <v-btn icon="mdi-close" @click="dialogExercices = false"></v-btn>
        <v-toolbar-title>Ajouter un exercice</v-toolbar-title>
        <v-toolbar-items>
          <v-btn text="Fermer" variant="text" @click="dialogExercices = false" class="bg-blue-accent-2"></v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <ExerciceList selectable v-model:selected="session!.exercices" />
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
