<script setup lang="ts">
const value = defineModel<number | undefined | null>()
const { unit } = defineProps<{ unit: string }>()

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
</script>

<template>
  <div class="d-inline-flex align-center">
    <v-number-input
      hide-details="auto"
      :reverse="false"
      controlVariant="hidden"
      label=""
      :hideInput="false"
      inset
      variant="solo-filled"
      v-model="value"
      class="mx-2"
      style="max-width: 70px"
      @focus="onFocus"
      @focusout="handleFocusout"
    ></v-number-input>
    <span>{{ unit }}</span>
  </div>
</template>
