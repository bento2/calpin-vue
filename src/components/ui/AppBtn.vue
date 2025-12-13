<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' | 'success'
    icon?: string
    block?: boolean
    loading?: boolean
    to?: RouteLocationRaw
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    block: false,
    loading: false,
    disabled: false,
  },
)

const btnProps = computed(() => {
  const base = {
    block: props.block,
    loading: props.loading,
    disabled: props.disabled,
    to: props.to,
  }

  switch (props.variant) {
    case 'primary':
      return {
        ...base,
        color: 'blue-accent-2',
        variant: 'flat' as const,
        class: 'text-white font-weight-bold',
      }
    case 'secondary':
      return {
        ...base,
        color: 'blue-accent-2',
        variant: 'outlined' as const,
        class: 'bg-white',
      }
    case 'danger':
      return {
        ...base,
        color: 'red-accent-4',
        variant: 'flat' as const,
        class: 'text-white',
      }
    case 'success':
      return {
        ...base,
        color: 'green-accent-4',
        variant: 'flat' as const,
        class: 'text-white',
      }
    case 'ghost':
      return {
        ...base,
        variant: 'text' as const,
      }
    case 'icon': // Special case handled locally if needed, or just mapped to icon-only props
      return {
        ...base,
        variant: 'text' as const,
        icon: props.icon, // We will use icon slot or prop
      }
    default:
      return base
  }
})
const icon = computed(() => (props.variant === 'icon' ? (props.icon ?? true) : false))
</script>

<template>
  <v-btn v-bind="btnProps">
    <v-icon v-if="icon">{{ icon }}</v-icon>
    <slot></slot>
  </v-btn>
</template>
