<script setup lang="ts">
import {type Session } from '@/types/SessionSchema.ts'

const model = defineModel<Session>()
</script>

<template>
  <v-card>
    {{ model.name }}
  </v-card>
</template>

<style scoped></style>
