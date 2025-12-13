<script setup lang="ts">
defineProps<{
    index: number
    isLast: boolean
    exerciceId: string
}>()

const emit = defineEmits<{
    (e: 'move-up', index: number): void
    (e: 'move-down', index: number): void
    (e: 'remove', id: string): void
}>()
</script>

<template>
    <v-menu>
        <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" variant="outlined" v-bind="props"></v-btn>
        </template>
        <v-list>
            <v-list-item @click="emit('move-up', index)" v-if="index > 0">
                <v-list-item-title>
                    <v-icon>mdi-arrow-up</v-icon>
                    Monter
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('move-down', index)" v-if="!isLast">
                <v-list-item-title>
                    <v-icon>mdi-arrow-down</v-icon>
                    Descendre
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('remove', exerciceId)">
                <v-list-item-title>
                    <v-icon>mdi-delete</v-icon>
                    Supprimer
                </v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>
