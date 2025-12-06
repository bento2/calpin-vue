<script setup lang="ts">
import type { Exercice } from '@/types/ExerciceSchema.ts'
import ExerciceIcon from '@/components/ExerciceIcon.vue'
import AppCard from '@/components/ui/AppCard.vue'

const props = defineProps<{ exercice: Exercice }>()
const { exercice } = props

</script>

<template>
  <AppCard color="blue-accent-2" outline>
    <div class="d-flex align-center font-bold mb-1 ga-1">
      <ExerciceIcon :exercice="exercice" />
      <div class="font-bold flex-grow-1 d-flex flex-column">
        {{ exercice.name }}
        <span class="text-caption" v-if="exercice.hasEquipment">{{ exercice.equipment }}</span>
        <slot name="subtitle"></slot>
      </div>
    </div>
    <slot name="actions"></slot>
  </AppCard>
</template>

<style scoped></style>
