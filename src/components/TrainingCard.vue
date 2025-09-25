<script setup lang="ts">
import { type Training } from '@/types/TrainingSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'

const props = defineProps<{ training: Training }>()
const training = props.training
</script>

<template>
  <div v-if="training === undefined">Cette entrainement n'existe pas</div>
  <v-card v-else :title="training.name" class="mb-1 ml-1 mr-1" elevation="16" hover>
    <v-card-text>
      <ExerciceIcon
        v-for="exercice in training.exercices"
        :exercice="exercice"
        :key="exercice.id"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped></style>
