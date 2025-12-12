<script setup lang="ts">
import { type Training } from '@/types/TrainingSchema.ts'
import { computed, onMounted, ref } from 'vue'
import ExerciceCard from '@/components/ExerciceCard.vue'
import Exercices from '@/components/ExerciceList.vue'
import { useTrainingStore } from '@/stores/useTrainingStore.ts'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'

const props = defineProps<{ training?: Training }>()
const route = useRoute()

const dialog = ref(false)
const training = ref<Training | null>(props.training || null)
const isLoading = ref(true)

const showSave = computed(() => {
  return training.value?.exercices && training.value.exercices.length > 0
})

const moveUp = (index: number) => {
  if (index > 0 && training.value) {
    const tmp = training.value?.exercices[index - 1]
    training.value.exercices[index - 1] = training.value.exercices[index]
    training.value.exercices[index] = tmp
  }
}

const moveDown = (index: number) => {
  if (training.value && index < training.value.exercices.length - 1) {
    const tmp = training.value?.exercices[index + 1]
    training.value.exercices[index + 1] = training.value.exercices[index]
    training.value.exercices[index] = tmp
  }
}

const { saveTraining, getTrainingById, createTraining } = useTrainingStore()

const error = ref<string | null>(null)

onMounted(async () => {
  try {
    if (route.params.id) {
      const tmp = await getTrainingById(route.params.id as string)
      if (tmp) {
        training.value = tmp
      }
    } else if (!props.training) {
      training.value = await createTraining()
    }
  } catch (e) {
    error.value = 'Erreur lors du chargement'
    console.error(e)
  } finally {
    isLoading.value = false
  }
})

const remove = (id: string) => {
  if (!training.value?.exercices) return

  const index = training.value.exercices.findIndex((e) => e.id === id)
  if (index !== -1) {
    training.value.exercices.splice(index, 1)
  }
}

const save = () => {
  if (training.value) {
    saveTraining(training.value)
  }
}

</script>

<template>
  <v-card v-if="training" class="d-flex flex-column" style="height: 100%">
    <v-card-title class="bg-blue mb-1">
      <v-text-field label="Titre de l'entrainement" v-model="training.name" hide-details="auto" clearable
        @click:clear="() => (training!.name = '')"></v-text-field>
    </v-card-title>

    <draggable v-model="training.exercices" item-key="id" :animation="200"
      v-if="training.exercices && training.exercices.length > 0">
      <template #item="{ element: exercice, index: idx }">
        <ExerciceCard :key="exercice.id" :exercice="exercice"
          class="d-flex flex-row justify-space-between align-center">
          <template #actions>
            <div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="outlined" v-bind="props"></v-btn>
                </template>
                <v-list>
                  <v-list-item @click="moveUp(idx)" v-if="idx > 0">
                    <v-list-item-title>Monter</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="moveDown(idx)" v-if="idx < training.exercices.length - 1">
                    <v-list-item-title>Descendre</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="remove(exercice.id)">
                    <v-list-item-title>
                      <v-icon>mdi-delete</v-icon>
                      Supprimer
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-btn icon variant="text" class="drag-handle" title="Déplacer">
                <v-icon>mdi-drag</v-icon>
              </v-btn>
            </div>
          </template>

        </ExerciceCard>
      </template>
    </draggable>

    <v-card-item class="text-center text-blue">
      <v-btn variant="elevated" @click="dialog = true" class="mt-2 mb-2">
        + Ajouter un exercice
      </v-btn>
    </v-card-item>

    <v-card-actions class="mt-auto align-self-end">
      <v-btn variant="elevated" :disabled="!showSave" color="#5865f2" @click="save">
        Enregistrer
      </v-btn>
    </v-card-actions>
  </v-card>

  <v-card v-else-if="isLoading" class="d-flex justify-center align-center" style="height: 100%">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-card>

  <v-card v-else-if="error" class="d-flex justify-center align-center h-100">
    <div class="text-red">{{ error }}</div>
  </v-card>

  <v-dialog v-model="dialog" transition="dialog-bottom-transition" width="95%" height="90vh" rounded elevation="4">
    <v-card v-if="training">
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h5 text-medium-emphasis ps-2">Ajouter des exercices</div>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
      </v-card-title>

      <v-card-item>
        <Exercices selectable v-model:selected="training.exercices" />
      </v-card-item>

      <v-card-actions class="mt-auto align-self-end">
        <v-btn @click="dialog = false" class="bg-red">Fermer</v-btn>
        <v-btn @click="dialog = false" class="bg-green">Ajouter</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.no-padding {
  padding: 0 !important;
}
</style>
