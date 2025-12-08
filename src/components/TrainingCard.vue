<script setup lang="ts">
import { type Training } from '@/types/TrainingSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBtn from '@/components/ui/AppBtn.vue'
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
  <AppCard v-else hover :title="training.name">
    <template #headerActions>
      <AppBtn variant="icon" icon="mdi-play" @click="run" color="blue-accent-2" />
      <AppBtn variant="icon" icon="mdi-note-edit" :to="{ name: 'training', params: { id: training.id } }"
        color="grey" />
      <AppBtn v-if="showDelete" variant="icon" icon="mdi-delete" @click="remove" color="red-lighten-2" />
    </template>

    <div class="d-flex flex-start ga-2 flex-wrap">
      <ExerciceIcon v-for="exercice in training.exercices" :exercice="exercice" :key="exercice.id" class="mr-2 mb-2" />
    </div>
  </AppCard>
</template>

<style scoped></style>
