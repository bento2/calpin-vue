<script setup lang="ts">
import { computed } from 'vue'
import type { Session } from '@/types/SessionSchema.ts'
import AppBtn from '@/components/ui/AppBtn.vue'

const props = defineProps<{
  modelValue: boolean // Is open
  session: Session | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save'): void
  (e: 'restart'): void
  (e: 'end'): void
  (e: 'cancel'): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const ended = computed(() => props.session?.ended ?? false)

const close = () => {
  isOpen.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" transition="dialog-bottom-transition" class="opacity-90">
    <template v-slot:default>
      <v-card title="Pause">
        <v-card-text class="d-flex flex-column ga-3">
          <AppBtn block @click="$emit('restart')" variant="secondary"> Recommencer </AppBtn>

          <!-- TODO: Check behavior of this button in original UI. It was 'Terminer et enregistrer' -->
          <AppBtn block @click="$emit('end')" variant="primary"> Terminer et enregistrer </AppBtn>

          <AppBtn v-if="!ended" block @click="$emit('save')" variant="success">
            <!-- Note: AppBtn variant doesn't have 'success' preset yet, passing direct color/class works due to v-bind but verify -->
            Sauvegarder
          </AppBtn>

          <AppBtn v-if="!ended" block @click="close" variant="secondary"> Reprendre </AppBtn>

          <AppBtn v-if="!ended" block @click="$emit('cancel')" variant="danger">
            Supprimer l'entrainement
          </AppBtn>
        </v-card-text>
        <v-card-actions>
          <AppBtn variant="ghost" @click="close">Fermer</AppBtn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
