<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => route.meta.title || '')
const noPadding = computed(() => route.meta.noPadding || false)
</script>
<template>
  <v-layout class="rounded rounded-md border h-100">
    <v-app-bar v-if="pageTitle !== ''" class="bg-blue-accent-3">
      <v-app-bar-title>
        <slot name="title">{{ pageTitle }}</slot>
      </v-app-bar-title>
      <v-app-bar-nav-icon>
        <RouterLink to="/">
          <v-icon icon="mdi-home" />
        </RouterLink>
      </v-app-bar-nav-icon>
    </v-app-bar>
    <v-main class="d-flex justify-center h-100 bg-blue-accent-1">
      <v-container fluid :class="{ 'pa-0': noPadding }">
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>
<style scoped>
a.router-link-active,
a.router-link-exact-active {
  outline: none;
  box-shadow: none;
}
</style>
