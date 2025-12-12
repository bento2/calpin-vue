import { ref } from 'vue'
import type { User } from 'firebase/auth'

export const mockUser = ref<User | null>(null)

export const useAuth = () => ({
  user: mockUser,
})
