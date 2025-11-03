<script setup lang="ts">
import { type Training } from '@/types/TrainingSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'
import { useSessionStore } from '@/stores/useSessionStore.ts'

import { useRouter } from 'vue-router'
import { useTrainingStore } from '@/stores/useTrainingStore.ts'

const props = defineProps<{ training: Training, showDelete?: boolean }>()
const training = props.training
const showDelete = props.showDelete ?? true;
const { createSession } = useSessionStore()
const { deleteTrainingById } = useTrainingStore()
const router = useRouter()
const run = () => {
  createSession(training).then((session) => {
    router.push({ name: 'session', params: { id: session.id } })
  })
}

const remove = () => {
  deleteTrainingById(training.id)
}
</script>

<template>
  <div v-if="training === undefined">Cette entrainement n'existe pas</div>
  <v-card v-else class="mb-1" hover>
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="text-medium-emphasis ps-2">{{ training.name }}</div>
      <div>
        <v-btn icon="mdi-play" variant="text" @click="run"></v-btn>
        <v-btn
          icon="mdi-note-edit"
          variant="text"
          :to="{ name: 'training', params: { id: training.id } }"
        ></v-btn>
        <v-btn icon="mdi-delete" variant="text" @click="remove" v-if="showDelete"></v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <ExerciceIcon
        v-for="exercice in training.exercices"
        :exercice="exercice"
        :key="exercice.id"
        class="mr-2"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped></style>
