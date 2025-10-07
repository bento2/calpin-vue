<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session.ts'
import { useRoute, useRouter } from 'vue-router'
import type { Session } from '@/types/SessionSchema.ts'
import ExerciceCard from '@/components/ExerciceCard.vue'
import SeriesCard from '@/components/SeriesCard.vue'
import { useSessionTimer } from '@/composables/useSessionTimer.ts'
import Exercices from '@/components/ExercicesCard.vue'

const session = ref<Session | null>(null)
const { getSessionById, deleteSession, finishSession, restartSession, updateSession } =
  useSessionStore()
const route = useRoute()
const router = useRouter()
const { diff } = useSessionTimer(session)

onMounted(async () => {
  if (route.params.id) {
    const tmp = await getSessionById(route.params.id as string)
    if (tmp !== undefined) {
      session.value = tmp
    }
  }
})

watch(
  () => session.value,
  (newValue) => {
    if (newValue !== null) {
      updateSession(newValue)
      if (newValue?.ended) {
        dialog.value = true
      }
    }
  },
  { deep: true },
)

const dialog = ref(false)
//const showEnded = computed(() => (session.value?.ended ?? false) )

const close = () => {
  dialog.value = false
}

const cancel = () => {
  if (session.value !== null) {
    deleteSession(session.value.id)
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

const end = () => {
  if (session.value !== null) {
    finishSession(session.value.id)
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

const updateExercices = () => {
  //il y a eu une mise à jour des exercices pour en ajouter 1
  //il faut chercher les exercices qui n'ont pas encore le bon type
  if (session.value) {
    session.value.exercices = session.value.exercices.map((exercice) => {
      if (exercice.series) return exercice

      return {
        ...exercice,
        completed: false,
        series: Array.from({ length: 4 }, () => ({
          poids: 0,
          repetitions: 0,
          checked: false,
        })),
      }
    })
  }
}
</script>

<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition" fullscreen class="opacity-90">
    <template v-slot:default="{}">
      <v-card class="bg-blue-accent-2" elevation="2" outline>
        <v-toolbar>
          <v-btn icon="mdi-close" @click="close"></v-btn>
          <v-toolbar-title>Pause</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="d-flex justify-space-evenly flex-column">
          <v-btn
            @click="goHome"
            class="text-white bg-blue-accent-4 opacity-100 px-15"
            elevation="2"
            outline
          >
            Quitter
          </v-btn>
          <v-btn
            @click="restart"
            class="text-white bg-blue-accent-4 opacity-100 px-15"
            elevation="2"
            outline
          >
            Recommencer
          </v-btn>
          <v-btn
            @click="end"
            class="text-white bg-blue-accent-4 opacity-100 px-15"
            elevation="2"
            outline
          >
            Terminer et enregistrer
          </v-btn>

          <v-btn
            @click="close"
            class="text-blue-accent-2 bg-white opacity-100 px-15"
            elevation="2"
            outline
          >
            Reprendre
          </v-btn>

          <v-btn
            @click="cancel"
            class="text-white bg-red-accent-4 opacity-100 px-15"
            elevation="2"
            outline
          >
            Supprimer l'entrainement
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <v-btn text="Fermer" @click="close"></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
  <v-dialog
    v-model="dialogExercices"
    transition="dialog-bottom-transition"
    width="95%"
    height="90vh"
    border
    rounded
    elevation="4"
  >
    <v-card v-if="session">
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h5 text-medium-emphasis ps-2">Ajouter des exercices</div>
        <v-btn icon="mdi-close" variant="text" @click="dialogExercices = false"></v-btn>
      </v-card-title>

      <v-card-item>
        <KeepAlive>
          <Exercices
            selectable
            v-model:selected="session.exercices"
            @update:selected="updateExercices"
          />
        </KeepAlive>
      </v-card-item>

      <v-card-actions class="mt-auto align-self-end">
        <v-btn @click="dialogExercices = false" class="bg-red">Fermer</v-btn>
        <v-btn @click="dialogExercices = false" class="bg-green">Ajouter</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <div v-if="session === null">La session n'existe pas</div>
  <template v-else>
    <v-app-bar class="bg-blue-accent-3">
      <v-app-bar-nav-icon>
        <v-btn icon="mdi-arrow-left" variant="text" @click="dialog = true"></v-btn>
      </v-app-bar-nav-icon>
      <v-app-bar-title class="d-flex flex-column justify-start">
        <div v-if="diff !== ''">{{ diff }}</div>
        <div class="text-body-2">{{ session.name }}</div>
      </v-app-bar-title>
    </v-app-bar>
    <div
      v-for="(exercice, index) in session.exercices"
      :key="exercice.id"
      class="d-flex flex-column justify-center"
    >
      <ExerciceCard :exercice="exercice">
        <template #actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-dots-vertical" variant="outlined" v-bind="props"></v-btn>
            </template>
            <v-list>
              <v-list-item @click="remove(exercice.id)">
                <v-list-item-title>
                  <v-icon>mdi-delete</v-icon>
                  Supprimer
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            :icon="isOpen(index) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :title="isOpen(index) ? 'Fermer' : 'Ouvrir'"
            variant="text"
            @click="toggle(index)"
          />
        </template>
      </ExerciceCard>
      <SeriesCard v-model="exercice.series" v-if="openIndexes.has(index)" />
    </div>
    <v-card-item class="text-center text-blue">
      <v-btn variant="elevated" @click="dialogExercices = true" class="mt-2 mb-2">
        + Ajouter un exercice
      </v-btn>
    </v-card-item>
  </template>
</template>

<style scoped></style>
