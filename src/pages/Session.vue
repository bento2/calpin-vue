<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue'
import { useSessionStore } from '@/stores/session.ts'
import { useRoute } from 'vue-router'
import type { Session } from '@/types/SessionSchema.ts'
import { forHumans } from '@/services/Functions.ts'
import ExerciceCard from '@/components/ExerciceCard.vue'
import SeriesCard from '@/components/SeriesCard.vue'

const session = ref<Session | null>(null)
const { getSessionById } = useSessionStore()
const route = useRoute()
const diff = ref('')

onMounted(async () => {
  if (route.params.id) {
    const tmp = await getSessionById(route.params.id as string)
    if (tmp !== undefined) {
      session.value = tmp
    }
  }
})
setInterval(() => {
  if (session.value) {
    diff.value = forHumans(Math.floor((Date.now() - session.value.dateDebut.getTime()) / 1000))
  }
}, 1000)

watch(
  () => session.value?.exercices,
  (newValue, oldValue) => {
    // Note: `newValue` will be equal to `oldValue` here
    // *unless* state.someObject has been replaced
    console.log(newValue)
  },
  { deep: true }
)
</script>

<template>
  <div v-if="session === null">La session n'existe pas</div>
  <template v-else>
    <v-app-bar class="bg-blue-accent-3" >
      <v-app-bar-nav-icon>
        <v-btn icon="mdi-arrow-left" variant="text"></v-btn>
      </v-app-bar-nav-icon>
      <v-app-bar-title class="d-flex flex-column justify-start">
        <div v-if="diff !== ''">{{ diff }}</div>
        <div class="text-body-2">{{ session.name }}</div>
      </v-app-bar-title>
    </v-app-bar>
    <div v-for="exercice in session.exercices" :key="exercice.id" class="d-flex flex-column justify-center">
      <ExerciceCard :exercice="exercice" />
      <SeriesCard v-model="exercice.series"/>
    </div>
  </template>
</template>

<style scoped></style>
