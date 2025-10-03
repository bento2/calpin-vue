<script setup lang="ts">
import { useTrainingStore } from '@/stores/training.ts'
import TrainingCard from '@/components/TrainingCard.vue'

import { useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'

const store = useTrainingStore()
const router = useRouter()
const update = ref(0)

onMounted(async () => {
  await store.loadTrainings()
})

const newTraining = async () => {
  const training = await store.createTraining()
  router.push({ name: 'training', params: { id: training.id } })
}

const trainings = computed(() => store.trainings)

watch(trainings, () => {
  update.value++;
})
</script>

<template>
  <v-btn @click="newTraining" class="mb-4">Nouvel entrainement</v-btn>
  <div :key="update">
    <TrainingCard
      v-for="training in trainings"
      :key="training.id"
      :training="training"
      :showDelete="true"
    />
  </div>
</template>

<style scoped></style>
