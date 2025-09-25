<script setup lang="ts">
import type { Exercice } from '@/types/ExerciceSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'

const props = defineProps<{ exercice: Exercice }>()
const { exercice } = props
</script>

<template>
  <v-card class="" color="indigo" elevation="2" outline>
    <v-card-text class="d-flex align-center font-bold mb-1 ga-1">
      <ExerciceIcon :exercice="exercice" />
      <div class="font-bold flex-grow-1">{{ exercice.name }}</div>
      <slot name="actions"></slot>
    </v-card-text>
  </v-card>
</template>

<style scoped></style>
