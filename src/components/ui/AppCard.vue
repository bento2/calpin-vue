<script setup lang="ts">
const props = withDefaults(defineProps<{
    title?: string
    subtitle?: string
    color?: string
    elevation?: string | number
    loading?: boolean
}>(), {
    elevation: 2,
    loading: false
})
</script>

<template>
    <v-card :color="color" :elevation="elevation" :loading="loading" class="app-card mb-2">
        <v-card-title v-if="title || $slots.title" class="d-flex justify-space-between align-center">
            <slot name="title">
                <span class="text-h6">{{ title }}</span>
            </slot>
            <div v-if="$slots.headerActions">
                <slot name="headerActions"></slot>
            </div>
        </v-card-title>

        <v-card-subtitle v-if="subtitle || $slots.subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
        </v-card-subtitle>

        <v-card-text :class="{ 'pt-0': title }">
            <slot></slot>
        </v-card-text>

        <v-card-actions v-if="$slots.actions">
            <slot name="actions"></slot>
        </v-card-actions>
    </v-card>
</template>

<style scoped>
/* Optional: specific styles if needed */
</style>
