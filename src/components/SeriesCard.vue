<script setup lang="ts">
import { type Serie } from '@/types/SerieSchema.ts'

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
    })
  }
}
</script>

<template>
  <v-card v-for="(serie, index) in series" :key="index"  hover :color="serie.checked ? 'success':''">
    <div class="d-flex flex-row align-center pa-2 justify-start" style="min-width: 320px">
      <v-checkbox
        :label="(index+1).toString()"
        color="primary"
        hide-details
        class="mr-2 rounded-checkbox"
        inset
        v-model="serie.checked"
      ></v-checkbox>
      <v-number-input
        hide-details="auto"
        :reverse="false"
        controlVariant="hidden"
        label=""
        :hideInput="false"
        inset
        variant="solo-filled"
        v-model="serie.poids"
        class="mx-2"
        style="max-width: 70px"
      ></v-number-input>
      <span>KG</span>
      <v-number-input
        hide-details="auto"
        :reverse="false"
        controlVariant="hidden"
        label=""
        :hideInput="false"
        inset
        variant="solo-filled"
        v-model="serie.repetitions"
        class="mx-2"
        style="max-width: 70px"
      ></v-number-input>
      <span>Rép.</span>
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
