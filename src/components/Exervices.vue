<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ExerciceUtils } from '@/services/ExerciceUtils.ts'
import type { Exercice } from '@/types/ExerciceSchema.ts'
import ExerciceCard from '@/components/ExerciceCard.vue'

const exercices = ref<Exercice[]>([])

onMounted(async () => {
  const utils = new ExerciceUtils()
  exercices.value = await utils.getAll()
})
</script>

<template>
  <n-list >
    <n-list-item v-for="exercice of exercices" :key="exercice.id">
        <ExerciceCard  :exercice="exercice"  />
    </n-list-item>
  </n-list>
</template>

<style scoped></style>
