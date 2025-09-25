<script setup lang="ts">
import { type Training, TrainingSchema } from '@/types/TrainingSchema.ts'
import { computed, onMounted, ref } from 'vue'
import ExerciceCard from '@/components/ExerciceCard.vue'
import Exercices from '@/components/Exercices.vue'
import { useTrainingStore } from '@/stores/training.ts'
import { v4 as uuidv4 } from 'uuid'
import { useRoute } from 'vue-router'

const props = withDefaults(defineProps<{ training?: Training }>(), {
  training: () =>
    TrainingSchema.parse({
      id: uuidv4().toLowerCase(),
      name: 'Entrainement 1',
      exercices: [],
    }),
})
const route = useRoute()

const dialog = ref(false)
const training = ref(props.training)
const showSave = computed(() =>
  training.value.exercices ? training.value.exercices.length > 0 : false,
)
const { saveTraining, loadTrainings, getTrainingById } = useTrainingStore()
onMounted(() => {
  loadTrainings()
  if (route.params.id) {
    const tmp = getTrainingById(route.params.id as string)
    if (tmp !== undefined) {
      training.value = tmp
    }
  }
})

const remove = (id:string) =>{
  const index = training.value.exercices.findIndex(e=>e.id = id)
  training.value.exercices.splice(index, 1)
}
const save = () => {
  saveTraining(training.value)
}
</script>

<template>
  <v-card class="d-flex flex-column" style="height: 100%">
    <v-card-title class="bg-blue mb-1">
      <v-text-field
        label="Titre de l'entrainement"
        v-model="training.name"
        hide-details="auto"
        clearable
        @click:clear="() => (training.name = '')"
      ></v-text-field>
    </v-card-title>
    <template v-if="training.exercices">
        <ExerciceCard v-for="exercice in training.exercices" :key="exercice.id" :exercice="exercice" class="w-100 mb-1">
          <template v-slot:actions>
            <v-btn
              icon="mdi-delete"
              variant="text"
              @click="remove(exercice.id)"
            ></v-btn>
          </template>
        </ExerciceCard>
    </template>
    <v-card-item class="text-center text-blue">
      <v-btn variant="elevated" @click="dialog = true" class="mt-2 mb-2">+ Ajouter un exercice</v-btn>
    </v-card-item>

    <v-card-actions class="mt-auto align-self-end">
      <v-btn variant="elevated" :disabled="!showSave" color="#5865f2" @click="save"
        >Enregistrer
      </v-btn>
    </v-card-actions>
  </v-card>
  <v-dialog
    v-model="dialog"
    transition="dialog-bottom-transition"
    width="95%"
    height="90vh"
    border
    rounded
    elevation="4"
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h5 text-medium-emphasis ps-2">Ajouter des exercices</div>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
      </v-card-title>
      <v-card-item>
        <KeepAlive>
          <Exercices selectable v-model:selected="training.exercices" />
        </KeepAlive>
      </v-card-item>
      <v-card-actions class="mt-auto align-self-end">
        <v-btn @click="dialog = false" class="bg-red"> close</v-btn>
        <v-btn @click="dialog = false" class="bg-green"> ajouter</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.no-padding{
  padding: 0 !important;
}
</style>
