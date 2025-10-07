<script setup lang="ts">
import type { Exercice } from '@/types/ExerciceSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'

const props = defineProps<{ exercice: Exercice }>()
const { exercice } = props

</script>

<template>
  <v-card class="bg-blue-accent-2" elevation="2" outline>
    <v-card-text class="d-flex align-center font-bold mb-1 ga-1">
      <ExerciceIcon :exercice="exercice" />
      <div class="font-bold flex-grow-1 d-flex flex-column">
        {{ exercice.name }}
        <span class="text-caption" v-if="exercice.hasEquipment">{{ exercice.equipment}}</span>
        <slot name="subtitle"></slot>
      </div>

      <slot name="actions"></slot>
    </v-card-text>
  </v-card>
</template>

<style scoped></style>
