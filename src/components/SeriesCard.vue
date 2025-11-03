<script setup lang="ts">
import { type Serie } from '@/types/SerieSchema.ts'
import InputNumberSerie from '@/components/InputNumberSerie.vue'

const series = defineModel({ type: Array<Serie> })
const remove = (index: number) => {
  if (series.value) series.value.splice(index, 1)
}

const add = () => {
  if (series.value) {
    series.value.push({
      poids: 0,
      repetitions: 0,
      checked: false,
      total:0
    })
  }
}

const autoCheck = (index: number) => {
  if (series.value) {
    const serie = series.value[index] as Serie
    serie.checked = (serie.poids || 0) > 0 && (serie.repetitions || 0) > 0
  }
}
</script>

<template>
  <v-card
    v-for="(serie, index) in series"
    :key="index"
    hover
    :color="serie.checked ? 'success' : ''"
  >
    <div class="d-flex flex-row align-center pa-2 justify-start" style="min-width: 320px">
      <v-checkbox
        :label="(index + 1).toString()"
        color="primary"
        hide-details
        class="mr-2 rounded-checkbox"
        inset
        v-model="serie.checked"
      ></v-checkbox>
      <InputNumberSerie v-model="serie.poids" unit="KG" />
      <InputNumberSerie v-model="serie.repetitions" unit="Rép ." @focusout="autoCheck(index)" />
      <v-btn icon="mdi-delete" variant="text" @click="remove(index)" class="ml-auto"></v-btn>
    </div>
  </v-card>
  <v-btn @click="add">+ Ajouter une serie</v-btn>
</template>

<style scoped>
.rounded-checkbox .v-selection-control__input .v-icon {
  border-radius: 50% !important;
}
</style>
