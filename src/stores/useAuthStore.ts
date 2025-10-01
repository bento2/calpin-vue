// src/stores/auth.ts
import { defineStore } from 'pinia'
import { auth, googleProvider } from '@/firebase'
import { useAuth } from '@vueuse/firebase/useAuth'
import { signInWithPopup, signOut } from 'firebase/auth'
import { computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // utilisateur réactif fourni par vueuse
  const { user } = useAuth(auth)

  async function login() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Erreur login:', err)
    }
  }

  async function logout() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Erreur logout:', err)
    }
  }

  return {
    user,
    login,
    logout,
    isAuthenticated: computed(() => !!user.value),
  }
})
