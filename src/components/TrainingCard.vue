<script setup lang="ts">
import { type Training } from '@/types/TrainingSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'

const props = defineProps<{ training: Training }>()
const training = props.training
</script>

<template>
  <div v-if="training === undefined">Cette entrainement n'existe pas</div>
  <v-card v-else class="mb-1" hover>
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="text-medium-emphasis ps-2">{{ training.name }}</div>
      <v-btn
        icon="mdi-note-edit"
        variant="text"
        :to="{ name: 'training', params: { id: training.id } }"
      ></v-btn>
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
