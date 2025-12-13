<script setup lang="ts">
import { type Exercice } from '@/types/ExerciceSchema' // Or whatever type is used in Training.exercices
import ExerciceCard from '@/components/ExerciceCard.vue'
import ExerciceActionsMenu from '@/components/ExerciceActionsMenu.vue'

// In TrainingPage: training.exercices is array of Exercice (or close to it)
// Checking TrainingPage.vue line 85: element: exercice
// Let's assume Exercice type for now.

defineProps<{
  exercice: Exercice
  index: number
  isLast: boolean
}>()

const emit = defineEmits<{
  (e: 'move-up', index: number): void
  (e: 'move-down', index: number): void
  (e: 'remove', id: string): void
}>()
</script>

<template>
  <ExerciceCard :key="exercice.id" :exercice="exercice" class="d-flex flex-row justify-space-between align-center">
    <template #actions>
      <div>
        <ExerciceActionsMenu :index="index" :is-last="isLast" :exercice-id="exercice.id"
          @move-up="emit('move-up', $event)" @move-down="emit('move-down', $event)" @remove="emit('remove', $event)" />

        <v-btn icon variant="text" class="drag-handle" title="Déplacer">
          <v-icon>mdi-drag</v-icon>
        </v-btn>
      </div>
    </template>
  </ExerciceCard>
</template>
