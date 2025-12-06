```vue
<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useSessionStore } from '@/stores/useSessionStore.ts'
import { useRoute, useRouter } from 'vue-router'
import { type Session, SessionSchema } from '@/types/SessionSchema.ts'
import ExerciceCard from '@/components/ExerciceCard.vue'
import InputNumberSerie from '@/components/InputNumberSerie.vue'
import ExerciceList from '@/components/ExerciceList.vue'
import AppBtn from '@/components/ui/AppBtn.vue'
import SessionPauseDialog from '@/components/SessionPauseDialog.vue'
import { debounce } from 'lodash-es'
import type { Serie } from '@/types/SerieSchema.ts'

const session = ref<Session | null>(null)
const stats = ref<Map<string, Serie> | null>(null)
const {
  getSessionById,
  deleteSession,
  finishSession,
  restartSession,
  updateSession,
  saveSession,
  findStatsExercices,
} = useSessionStore()
const route = useRoute()
const router = useRouter()
const ended = computed(() => session.value?.ended ?? false)

const saveLocal = (s: Session) => {
  localStorage.setItem(`calpin_session_${s.id}`, JSON.stringify(s))
}

const clearLocal = (id: string) => {
  localStorage.removeItem(`calpin_session_${id}`)
}

onMounted(async () => {
  if (route.params.id) {
    const id = route.params.id as string
    const local = localStorage.getItem(`calpin_session_${id}`)
    let loadedSession: Session | undefined

    if (local) {
      try {
        loadedSession = SessionSchema.parse(JSON.parse(local))
        // Sync local changes to store/server
        updateSession(loadedSession)
      } catch (e) {
        console.error('Erreur chargement local', e)
      }
    }

    if (!loadedSession) {
      loadedSession = await getSessionById(id)
    }

    if (loadedSession) {
      session.value = loadedSession
      findStatsExercices().then((value) => {
        stats.value = value
      })
    }
  }
})
const debouncedUpdate = debounce((value) => {
  updateSession(value)
}, 2000)

const menu = ref(false)
const timerDisplay = ref('00:00:00') // Placeholder

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

// unused functions removed

const dialogExercices = ref(false)

const getLastVal = (_exerciceId: string, _serieIndex: number): Serie | undefined => {
  // TODO: Implement actual logic to fetch last value
  return undefined
}

const addSerie = (exerciceIndex: number) => {
  if (session.value && session.value.exercices[exerciceIndex]?.series) {
    session.value.exercices[exerciceIndex].series?.push({
      poids: 0,
      repetitions: 0,
      checked: false,
      total: 0,
    });
  }
}
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
        <div class="mr-4">{{ timerDisplay }}</div>

        <AppBtn variant="icon" icon="mdi-pause" @click="menu = true" class="bg-white text-blue-accent-2" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="overflow-y-auto flex-grow-1 px-2 pt-2 pb-14 bg-grey-lighten-4">
      <div v-for="(exercice, index) in session.exercices" :key="exercice.id" class="mb-4">
        <ExerciceCard :exercice="exercice">
          <template #subtitle>
            <div class="d-flex ga-2 mt-1">
              <v-chip size="x-small" label color="blue-accent-2" class="font-weight-bold">
                {{ exercice.series?.length ?? 0 }} séries
              </v-chip>
            </div>
          </template>

          <template #actions>
            <div class="d-flex flex-column ga-2 mt-2 w-100">
              <div v-for="(serie, sIndex) in exercice.series" :key="sIndex"
                class="d-flex align-center justify-space-between bg-white rounded pa-2 border-sm border-opacity-25"
                :class="serie.checked ? 'border-success' : 'border-grey'">
                <div class="d-flex align-center ga-3">
                  <span class="text-body-2 font-weight-bold text-grey-darken-1" style="min-width: 20px">#{{ sIndex + 1
                    }}</span>
                  <!-- InputNumberSerie component is not defined in the provided context, assuming it's a custom component -->
                  <!-- For now, using basic input elements -->
                  <InputNumberSerie v-model="serie.poids" unit="kg"
                    :placeholder="getLastVal(exercice.id, sIndex)?.poids ?? undefined" @focusout="debouncedUpdate" />
                  <InputNumberSerie v-model="serie.repetitions" unit="reps"
                    :placeholder="getLastVal(exercice.id, sIndex)?.repetitions ?? undefined"
                    @focusout="debouncedUpdate" />
                </div>
                <v-checkbox-btn v-model="serie.checked" color="success" density="compact" class="ma-0 pa-0"
                  @update:model-value="saveLocal(session)"></v-checkbox-btn>
              </div>
            </div>
            <!-- Add Series Button -->
            <div class="d-flex justify-center mt-2">
              <AppBtn variant="secondary" size="small" @click="addSerie(index)" class="px-6">
                <v-icon start>mdi-plus</v-icon> Ajouter une série
              </AppBtn>
            </div>
          </template>
        </ExerciceCard>
      </div>
    </div>

    <!-- Footer/Finish -->
    <div class="pa-2 bg-white border-t" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 10;">
      <AppBtn block size="large" @click="end" :variant="ended ? 'secondary' : 'primary'">
        {{ ended ? 'Terminé' : 'Terminer la séance' }}
      </AppBtn>
    </div>

    <!-- Pause Menu Dialog -->
    <SessionPauseDialog v-model="menu" :session="session" @restart="restart" @save="save" @end="end" @cancel="cancel" />
  </div>
  <v-dialog v-model="dialogExercices" transition="dialog-bottom-transition" fullscreen>
    <v-card v-if="session">
      <v-toolbar color="primary">
        <v-btn icon="mdi-close" @click="dialogExercices = false"></v-btn>
        <v-toolbar-title>Ajouter un exercice</v-toolbar-title>
        <v-toolbar-items>
          <v-btn text="Enregistrer" variant="text" @click="dialogExercices = false"></v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <ExerciceList selectable v-model:selected="session!.exercices" />
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
