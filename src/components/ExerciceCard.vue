<script setup lang="ts">
import type { Exercice } from '@/types/ExerciceSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'

const props = defineProps<{ exercice: Exercice }>()
const { exercice } = props
</script>

<template>
  <v-card color="blue-accent-2" outline class="d-flex flex-row justify-space-between">
    <div class="d-flex align-center font-bold ga-1 w-100">
      <ExerciceIcon :exercice="exercice" class="ml-1" />
      <div class="font-bold flex-grow-1 d-flex flex-column">
        {{ exercice.name }}
        <span class="text-caption" v-if="exercice.hasEquipment">{{ exercice.equipment }}</span>
        <slot name="subtitle"></slot>
      </div>
    </div>
    <div class="d-flex align-center justify-end">
      <slot name="actions"></slot>
    </div>
  </v-card>
</template>

<style scoped></style>
