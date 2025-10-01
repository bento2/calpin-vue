<template>
  <v-tooltip v-if="auth.isAuthenticated" :text="auth.user?.displayName ?? ''">
    <template #activator="{ props: activatorProps }">
      <v-avatar
        v-bind="activatorProps"
        :size="size"
        :class="['user-avatar', roundedClass]"
        :style="avatarStyle"
      >
        <v-img
          v-if="auth.user?.photoURL !== null && !imageError"
          :src="auth.user?.photoURL ?? ''"
          :alt="altText"
          @error="onImageError"
          cover
        />
        <template v-else>
          <span v-if="initials" class="initials">{{ initials }}</span>
          <v-icon v-else class="anon-icon" size="20">mdi-account</v-icon>
        </template>
      </v-avatar>
    </template>
  </v-tooltip>

  <v-avatar v-else :size="size" :class="['user-avatar', roundedClass]" :style="avatarStyle">
    <v-img
      v-if="hasImage && !imageError"
      :src="avatarUrl"
      :alt="altText"
      @error="onImageError"
      cover
    />
    <template v-else>
      <v-btn @click="auth.login()">
        <span v-if="initials" class="initials">{{ initials }}</span>
        <v-icon v-else class="anon-icon" size="20">mdi-account</v-icon>
      </v-btn>
    </template>
  </v-avatar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore.ts'

interface User {
  id?: string
  name?: string | null
  avatarUrl?: string | null
}

const props = defineProps({
  user: { type: Object as PropType<User | null>, default: null },
  size: { type: [Number, String], default: 40 },
  rounded: { type: [Boolean, String], default: true }, // true | 'xl' | false
  tooltip: { type: [String], default: '' }, // true or custom text
  placeholderInitials: { type: String, default: 'I' }, // initial if no name
})

const avatarUrl = computed(() => props.user?.avatarUrl ?? '')
const hasImage = computed(() => !!avatarUrl.value)
const imageError = ref(false)

function onImageError() {
  imageError.value = true
}

const displayName = computed(() => {
  if (!props.user) return null
  return props.user.name ?? null
})

const initials = computed(() => {
  const name = auth.user?.displayName
  if (!name) return null
  // simple initials: first letters of first two words
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
})

const altText = computed(() =>
  auth.user ? `${auth.user.displayName}` : 'Utilisateur invité',
)

// rounded class
const roundedClass = computed(() => {
  if (props.rounded === false) return ''
  if (props.rounded === true) return 'rounded-full'
  return `rounded-${props.rounded}`
})

// generate a background color from name (deterministic)
function stringToHue(s: string) {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

const bgColor = computed(() => {
  const name = displayName.value
  if (!name) return '#e0e0e0' // neutral grey for anonymous
  const hue = stringToHue(name)
  // use HSL for pleasant pastel backgrounds
  return `hsl(${hue} 60% 75%)`
})

const avatarStyle = computed(() => {
  if (hasImage.value && !imageError.value) return {}
  return {
    background: bgColor.value,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#222',
  }
})

const auth = useAuthStore()

</script>

<style scoped>
.user-avatar {
  overflow: hidden;
  user-select: none;
}

.initials {
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0.15em 0.3em;
}

.anon-icon {
  opacity: 0.75;
}
</style>
