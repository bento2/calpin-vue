<script setup lang="ts">
import { useSessionStore } from '@/stores/session.ts'
import { onMounted, ref } from 'vue'
import type { Session } from '@/types/SessionSchema.ts'
import { useSessionTimer } from '@/composables/useSessionTimer.ts'
import UserAvatar from '@/components/UserAvatar.vue'
import { useTrainingStore } from '@/stores/training.ts'
import type { Training } from '@/types/TrainingSchema.ts'
import TrainingCard from '@/components/TrainingCard.vue'

const { getSessionActive } = useSessionStore()
const { getTrainings } = useTrainingStore()
const activeSession = ref<Session | null>(null)
const lastTrainnings = ref<Training[] | null>(null)
const { diff } = useSessionTimer(activeSession)

onMounted(async () => {
  getSessionActive().then((session) => {
    activeSession.value = session ?? null
  })

  getTrainings().then((trainings) => {
    lastTrainnings.value = trainings.slice(0, 3)
  })
})
</script>

<template>
  <v-main class="d-flex flex-column" style="flex: 1 1 auto; min-height: calc(100vh - 100px)">
    <v-card
      v-if="activeSession !== null"
      class="bg-green-darken-1 pa-2 d-flex justify-space-between align-center flex-row"
    >
      <div class="text-left">
        <p class="text-caption">{{ activeSession.name }}</p>
        <p>{{ diff }}</p>
      </div>
      <v-btn
        class="bg-white text-green-darken-3"
        rounded="xl"
        outline
        :to="{ name: 'session', params: { id: activeSession.id } }"
        >continuer
      </v-btn>
    </v-card>

    <template v-if="lastTrainnings !== null">
      <TrainingCard v-for="training in lastTrainnings" :training="training" :key="training.id" />
    </template>
  </v-main>

  <v-bottom-navigation grow height="64" class="bg-transparent d-flex align-center">
    <UserAvatar />
    <v-btn class="d-flex flex-column align-center" variant="text" :to="{ name: 'trainings' }">
      <v-icon size="28">mdi-dumbbell</v-icon>
      <span class="text-caption">Entraînements</span>
    </v-btn>

    <v-btn class="d-flex flex-column align-center" variant="text" :to="{ name: 'exercices' }">
      <v-icon size="28">mdi-run</v-icon>
      <span class="text-caption">Exercices</span>
    </v-btn>

    <v-btn class="d-flex flex-column align-center" variant="text">
      <v-icon size="28">mdi-history</v-icon>
      <span class="text-caption">Historiques</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<style scoped></style>
