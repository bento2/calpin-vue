<script setup lang="ts">
import { type Session } from '@/types/SessionSchema.ts'
import { useSlots } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'

const slots = useSlots()
const model = defineModel<Session>()
</script>

<template>
  <AppCard :title="model?.name ?? 'Pas de nom'">
    <p>Nombre d'exercices : {{ model?.nbChecked }}</p>
    <p>Total Poids : {{ model?.total.toLocaleString() }} Kg</p>

    <template #actions v-if="slots.actions">
      <slot name="actions"></slot>
    </template>
  </AppCard>
</template>

<style scoped></style>
