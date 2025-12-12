<script setup lang="ts">
import { type Exercice } from '@/types/ExerciceSchema' // Or whatever type is used in Training.exercices
import ExerciceCard from '@/components/ExerciceCard.vue'

// In TrainingPage: training.exercices is array of Exercice (or close to it)
// Checking TrainingPage.vue line 85: element: exercice
// Let's assume Exercice type for now.

defineProps<{
    exercice: Exercice
    index: number
    isLast: boolean
}>()

const emit = defineEmits<{
    (e: 'move-up', index: number): void
    (e: 'move-down', index: number): void
    (e: 'remove', id: string): void
}>()
</script>

<template>
    <ExerciceCard :key="exercice.id" :exercice="exercice" class="d-flex flex-row justify-space-between align-center">
        <template #actions>
            <div>
                <v-menu>
                    <template v-slot:activator="{ props }">
                        <v-btn icon="mdi-dots-vertical" variant="outlined" v-bind="props"></v-btn>
                    </template>
                    <v-list>
                        <v-list-item @click="emit('move-up', index)" v-if="index > 0">
                            <v-list-item-title>Monter</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="emit('move-down', index)" v-if="!isLast">
                            <v-list-item-title>Descendre</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="emit('remove', exercice.id)">
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
