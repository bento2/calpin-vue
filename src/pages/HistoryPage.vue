<script setup lang="ts">
import { useSessionStore } from '@/stores/useSessionStore.ts'
import { onMounted, ref } from 'vue'
import type { Session } from '@/types/SessionSchema.ts'
import SessionCard from '@/components/SessionCard.vue'

const { getSessions } = useSessionStore()
const sessions = ref<Session[] | []>([])

onMounted(async () => {
  getSessions().then((all) => {
    sessions.value = all ?? []
  })
})
</script>

<template>
  <SessionCard v-for="session in sessions" :key="session.id" :model-value="session" class="mb-4"></SessionCard>
</template>

<style scoped></style>
