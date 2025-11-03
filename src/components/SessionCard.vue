<script setup lang="ts">
import { type Session } from '@/types/SessionSchema.ts'
import { useSlots } from 'vue'

const slots = useSlots()
const model = defineModel<Session>()
</script>

<template>
  <v-card>
    <v-card-title>
      {{ model?.name ?? 'Pas de nom'}}
    </v-card-title>
    <v-card-text>
      <p>Nombre d'exercices : {{model?.nbChecked }}</p>
      <p>Total Poids : {{model?.total.toLocaleString() }} Kg</p>
    </v-card-text>
    <v-card-actions  v-if="slots.actions">
      <slot name="actions">
      </slot>
    </v-card-actions>
  </v-card>
</template>

<style scoped></style>
