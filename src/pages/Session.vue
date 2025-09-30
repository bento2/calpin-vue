<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session.ts'
import { useRoute, useRouter } from 'vue-router'
import type { Session } from '@/types/SessionSchema.ts'
import { forHumans } from '@/services/Functions.ts'
import ExerciceCard from '@/components/ExerciceCard.vue'
import SeriesCard from '@/components/SeriesCard.vue'

const session = ref<Session | null>(null)
const { getSessionById, deleteSession, finishSession, restartSession, updateSession } =
  useSessionStore()
const route = useRoute()
const router = useRouter()
const diff = ref('')

onMounted(async () => {
  if (route.params.id) {
    const tmp = await getSessionById(route.params.id as string)
    if (tmp !== undefined) {
      session.value = tmp
    }
  }
})
setInterval(() => {
  if (session.value) {
    diff.value = forHumans(Math.floor((Date.now() - session.value.dateDebut.getTime()) / 1000))
  }
}, 1000)

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

const dialog = ref(true)
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
      v-for="exercice in session.exercices"
      :key="exercice.id"
      class="d-flex flex-column justify-center"
    >
      <ExerciceCard :exercice="exercice" />
      <SeriesCard v-model="exercice.series" />
    </div>
  </template>
</template>

<style scoped></style>
