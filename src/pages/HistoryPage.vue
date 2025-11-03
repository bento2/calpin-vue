<script setup lang="ts">
import { useSessionStore } from '@/stores/useSessionStore.ts'
import { onMounted, ref } from 'vue'
import { type Session } from '@/types/SessionSchema.ts'
import SessionCard from '@/components/SessionCard.vue'

const { getSessions } = useSessionStore()
const sessions = ref<Session[] | []>([])

onMounted(async () => {
  getSessions().then((all) => {
    sessions.value = all ?? []
    //recherche de la présence de sessions dans l'ancien store
    /**const local = new LocalStorageAdapter<Session>()
    let count = 0;
    local.get('sessions').then((data) => {
      if(Array.isArray(data)){
        data.map((session: Session) => {
          const index = sessions.value.findIndex((element) => element.id === session.id)
          if(index === -1) {
            count++;
            //la session n'est pas dans la liste
            sessions.value.push(SessionSchema.parse(session))
          }
        })
      }
      if(count !== 0){
        persistSessions()
      }
    })**/
  })


})
</script>

<template>
  <SessionCard
    v-for="session in sessions"
    :key="session.id"
    :model-value="session"
    class="mb-4"
  ></SessionCard>
</template>

<style scoped></style>
