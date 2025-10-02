<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { ExerciceUtils } from '@/services/ExerciceUtils.ts'
import type { Exercice } from '@/types/ExerciceSchema.ts'
import ExerciceCard from '@/components/ExerciceCard.vue'

const props = withDefaults(
  defineProps<{
    selectable?: boolean
    selected?: Exercice[]
  }>(),
  { selectable: false, selected: () => [] },
)

const exercices = ref<Exercice[]>([])
const selectedExercices = props.selected
const page = ref(0)
const filter = ref('')

let utils: ExerciceUtils
const infiniteScrollRef = useTemplateRef('scroll')
onMounted(async () => {
  utils = ExerciceUtils.getInstance()
  exercices.value = utils.find({ page: page.value })
})

const updateExercices = ({ done }: { done: (status: 'ok' | 'empty' | 'error') => void }) => {
  const newExercices = utils.find({ page: ++page.value, filter: filter.value })
  exercices.value.push(...newExercices)
  done(newExercices.length > 0 ? 'ok' : 'empty')
}
const emit = defineEmits<{
  (e: 'update:selected', value: Exercice[]): void
}>()
const updateSelected = (exercice: Exercice): void => {
  const index = selectedExercices.findIndex((e) => e.id === exercice.id)
  if (index === -1) {
    selectedExercices.push(exercice)
  } else {
    selectedExercices.splice(index, 1)
  }
  emit('update:selected', selectedExercices)
}

const merged = computed(() => {
  return [...new Map([...selectedExercices, ...exercices.value].map((e) => [e.id, e])).values()]
})

watch(filter, (newValue) => {
  infiniteScrollRef.value?.reset('start')
  page.value = 0
  exercices.value = utils.find({ filter: newValue })
})
</script>

<template>
  <div class="mt-2">
    <v-text-field
      clearable
      label="Recherche"
      variant="outlined"
      v-model="filter"
      placeholder="Nom d'un exercice"
      append-inner-icon="mdi-magnify"
      hide-details="auto"
      density="compact"
      @click:clear="() => (filter = '')"
    ></v-text-field>
    <v-infinite-scroll :items="merged" @load="updateExercices" ref="scroll" :key="filter">
      <template v-for="exercice of merged" :key="exercice.id">
        <ExerciceCard :exercice="exercice">
          <template v-slot:actions>
            <v-checkbox
              v-if="props.selectable"
              class="align-self-end"
              hide-details="auto"
              :model-value="selectedExercices.some((e) => e.id === exercice.id)"
              color="success"
              @update:model-value="() => updateSelected(exercice)"
            ></v-checkbox>
          </template>
        </ExerciceCard>
      </template>
    </v-infinite-scroll>
  </div>
</template>

<style scoped></style>
