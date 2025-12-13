<script setup lang="ts">
import { useSessionStore } from '@/stores/useSessionStore.ts'
import { onMounted, ref } from 'vue'
import { type Session } from '@/types/SessionSchema.ts'
import SessionCard from '@/components/SessionCard.vue'

const { getSessions, deleteSession } = useSessionStore()
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

const confirmDelete = (id: string) => {
  if (confirm('Voulez-vous vraiment supprimer cette session ?')) {
    deleteSession(id)
  }
}
</script>

<template>
  <SessionCard v-for="session in sessions" :key="session.id" :model-value="session" class="mb-4">
    <template #actions>
      <div class="d-flex ml-auto">
        <v-btn
          icon="mdi-pencil"
          variant="text"
          :to="{ name: 'session', params: { id: session.id } }"
        ></v-btn>
        <v-btn icon="mdi-delete" variant="text" @click="confirmDelete(session.id)"></v-btn>
      </div>
    </template>
  </SessionCard>
</template>

<style scoped></style>
