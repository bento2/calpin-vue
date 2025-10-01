<script setup lang="ts">
import { useTrainingStore } from '@/stores/training.ts'
import TrainingCard from '@/components/TrainingCard.vue'
import { onMounted, ref } from 'vue'
import type { Training } from '@/types/TrainingSchema.ts'
import { useRouter } from 'vue-router'

const { getTrainings, createTraining } = useTrainingStore()
const trainings = ref<Training[]>([])
const router = useRouter()
onMounted(async () => {
  trainings.value = await getTrainings()
})

const newTraining = async () => {
  const training = await createTraining()
  router.push({ name: 'training', params: { id: training.id } })
}
</script>

<template>
  <v-btn @click="newTraining" class="mb-4">Nouvel entrainement</v-btn>
  <TrainingCard v-for="training in trainings" :key="training.id" :training="training" />
</template>

<style scoped></style>
