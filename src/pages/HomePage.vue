<script setup lang="ts">
import { useSessionStore } from '@/stores/session.ts'
import { onMounted, ref } from 'vue'
import type { Session } from '@/types/SessionSchema.ts'
import { useSessionTimer } from '@/composables/useSessionTimer.ts'
import UserAvatar from '@/components/UserAvatar.vue'

const { getSessionActive } = useSessionStore()
const activeSession = ref<Session | null>(null)
const { diff } = useSessionTimer(activeSession)

onMounted(async () => {
  getSessionActive().then((session) => {
    activeSession.value = session ?? null
  })
})
</script>

<template>
  <v-main>
    <v-card
      v-if="activeSession !== null"
      class="bg-green-darken-1 pa-2 d-flex justify-space-between align-center flex-row"
    >
      <div class="text-left">
        <p class="text-caption">{{ activeSession.name }}</p>
        <p>{{ diff }}</p>
      </div>
      <v-btn
        class="bg-white text-green-darken-3"
        rounded="xl"
        outline
        :to="{ name: 'session', params: { id: activeSession.id } }"
        >continuer
      </v-btn>
    </v-card>
  </v-main>
  <v-footer app fixed class="bg-transparent d-flex flex-row justify-space-between" >
    <UserAvatar />
    <v-btn :to="{name: 'trainings'}">Entrainements</v-btn>
  </v-footer>
</template>

<style scoped></style>
