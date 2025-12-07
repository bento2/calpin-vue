<script setup lang="ts">
import { computed } from 'vue'

const value = defineModel<number | undefined | null>()
const { unit, placeholder } = defineProps<{ unit: string, placeholder?: number | undefined }>()

// Déclarez seulement focusout, pas update:modelValue
const emit = defineEmits<{
  'focusout': [event: FocusEvent]
}>()

const handleFocusout = (event: FocusEvent) => {
  emit('focusout', event)
}

const onFocus = (): void => {
  if (value.value === 0) {
    value.value = null
  }
}

const displayValue = computed({
  get: () => (value.value && value.value > 0) ? value.value : null,
  set: (val) => { value.value = val }
})
</script>

<template>
  <div class="d-inline-flex align-center">
    <v-number-input hide-details="auto" :reverse="false" controlVariant="hidden" label="" :hideInput="false" inset
      :placeholder="placeholder !== undefined ? `${placeholder}` : '0'" variant="solo-filled" v-model="displayValue"
      class="mx-2" style="max-width: 70px" @focus="onFocus" @focusout="handleFocusout"></v-number-input>
    <span>{{ unit }}</span>
  </div>
</template>
