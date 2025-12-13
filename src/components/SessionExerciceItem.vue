<script setup lang="ts">

import { type ExerciceSeries } from '@/types/ExerciceSeriesSchema' // Assuming this type exists or will be inferred correctly, actually Session has Exercice[] but let's check types.
// In SessionPage it iterates over session.exercices.
// Let's check session schema or usage.
// In SessionPage: param (exercice, index) in session.exercices
// Exercice type in SessionSchema likely includes series.
import ExerciceCard from '@/components/ExerciceCard.vue'

defineProps<{
  exercice: ExerciceSeries
  index: number
  isOpen: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  (e: 'move-up', index: number): void
  (e: 'move-down', index: number): void
  (e: 'remove', id: string): void
  (e: 'toggle', index: number): void
}>()
</script>

<template>
  <ExerciceCard :exercice="exercice" class="d-flex flex-row space-between align-center ga-2">
    <template #subtitle>
      <v-chip size="x-small" label :color="exercice.nbChecked === exercice.series?.length ? 'success' : 'white'"
        class="font-weight-bold ml-auto">
        {{ exercice.nbChecked ?? 0 }} / {{ exercice.series?.length ?? 0 }} séries
      </v-chip>
    </template>

    <template #actions>
      <div class="d-flex flex-row ga-2 mt-2">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" variant="outlined" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item @click="emit('move-up', index)" v-if='index > 0'>
              <v-list-item-title>
                <v-icon>mdi-arrow-up</v-icon>
                Monter
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('move-down', index)" v-if='!isLast'>
              <v-list-item-title>
                <v-icon>mdi-arrow-down</v-icon>
                Déscendre
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('remove', exercice.id)">
              <v-list-item-title>
                <v-icon>mdi-delete</v-icon>
                Supprimer
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" :title="isOpen ? 'Fermer' : 'Ouvrir'"
          variant="text" @click="emit('toggle', index)" />
      </div>
    </template>
  </ExerciceCard>
</template>
