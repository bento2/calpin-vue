<script setup lang="ts">
import type { Exercice } from '@/types/ExerciceSchema.ts'

const props = defineProps<{ exercice: Exercice }>()
const { exercice } = props
</script>

<template>
  <v-avatar size="56" color="transparent" class="border" style="border: 2px solid black">
    <v-img :src="exercice.icon" :alt="exercice.name" cover />
  </v-avatar>
</template>

<style scoped>
.border-color {
  border: 1px solid blue;
  border-radius: 4px; /* optionnel */
}
</style>
