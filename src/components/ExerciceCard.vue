<script setup lang="ts">
import type { Exercice } from '@/types/ExerciceSchema.ts'

const props = defineProps<{ exercice: Exercice }>()
const { exercice } = props
</script>

<template>
  <n-thing>
    <template #avatar>
      <n-image
        :src="exercice.icon"
        width="48"
        height="48"
        object-fit="cover"
        style="border-radius: 8px"
      />
    </template>
    <template #header>{{ exercice.name }}</template>
    <template #description>{{ exercice.description }}</template>
  </n-thing>
</template>

<style scoped></style>
