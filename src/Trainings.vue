<script setup lang="ts">
import { useTrainingStore } from '@/stores/training.ts'
import TrainingCard from '@/components/TrainingCard.vue'
import { onMounted, ref } from 'vue'
import type { Training } from '@/types/TrainingSchema.ts'

const { getTrainings, loadTrainings } = useTrainingStore()
const trainings = ref<Training[]>([])
onMounted(() => {
  loadTrainings()
  trainings.value = getTrainings()
})
</script>

<template>
  <TrainingCard v-for="training in trainings" :key="training.id" :training="training" />
</template>

<style scoped></style>
