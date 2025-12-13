import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import type { User as AuthUser } from 'firebase/auth'
import { ref } from 'vue'

// Mock useAuth pour empêcher la réinitialisation automatique de l'état utilisateur pendant les tests
vi.mock('@vueuse/firebase/useAuth', () => ({
  useAuth: () => ({
    user: ref(null),
    isAuthenticated: ref(false),
  }),
}))

describe('UserAvatar.vue', () => {
  const createWrapper = (props = {}, pinia = createTestingPinia({ createSpy: vi.fn })) => {
    return mount(UserAvatar, {
      props,
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': { template: '<div><slot name="activator" :props="{}"></slot></div>' },
          'v-btn': {
            template: '<button class="login-btn" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-avatar': {
            template: '<div class="v-avatar" :style="style" :class="$attrs.class"><slot /></div>',
            props: ['style'],
          },
          'v-img': {
            template: '<img class="v-img" :src="src" @error="$emit(\'error\')" />',
            props: ['src'],
          },
          'v-icon': { template: '<span class="v-icon">icon</span>' },
        },
      },
    })
  }

  const setupAuthStore = (
    pinia: ReturnType<typeof createTestingPinia>,
    user: AuthUser | null,
    isAuthenticated: boolean,
  ) => {
    const authStore = useAuthStore(pinia)
    authStore.user = user
    Object.defineProperty(authStore, 'isAuthenticated', {
      value: isAuthenticated,
      writable: true,
    })
    return authStore
  }

  it("affiche l'avatar de l'utilisateur connecté avec image", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    setupAuthStore(
      pinia,
      {
        uid: '123',
        displayName: 'John Doe',
        photoURL: 'https://example.com/photo.jpg',
        email: 'john@example.com',
      } as AuthUser,
      true,
    )

    const wrapper = createWrapper({}, pinia)

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/photo.jpg')
    expect(wrapper.html()).toMatchSnapshot()
  })

  it("affiche les initiales si pas d'image for logged in user", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    setupAuthStore(
      pinia,
      {
        uid: '123',
        displayName: 'John Doe',
        photoURL: null,
      } as AuthUser,
      true,
    )

    const wrapper = createWrapper({}, pinia)

    expect(wrapper.find('.initials').exists()).toBe(true)
    expect(wrapper.find('.initials').text()).toBe('JD')
  })

  it('gère les initiales pour un nom unique (logged in)', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    setupAuthStore(pinia, { displayName: 'Admin', photoURL: null } as AuthUser, true)

    const wrapper = createWrapper({}, pinia)

    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.initials').exists()).toBe(true)
    expect(wrapper.find('.initials').text()).toBe('A')
  })

  it("affiche l'icône anonyme si non connecté et pas de prop user", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = setupAuthStore(pinia, null, false)
    authStore.login = vi.fn()

    const wrapper = createWrapper({}, pinia)

    expect(wrapper.find('.v-icon').exists()).toBe(true)

    // Le composant rend deux v-btns (externe et interne). L'interne déclenche la connexion.
    const innerBtn = wrapper.find('.v-avatar .login-btn')

    expect(innerBtn.exists()).toBe(true)
    await innerBtn.trigger('click')

    expect(authStore.login).toHaveBeenCalled()
  })

  it('utilise la prop user si fournie (mode non connecté)', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    setupAuthStore(pinia, null, false)

    const wrapper = createWrapper(
      {
        user: {
          name: 'Jane Doe',
          avatarUrl: 'https://example.com/jane.jpg',
        },
      },
      pinia,
    )

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/jane.jpg')
  })

  it("gère l'erreur de chargement d'image (logged in)", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    setupAuthStore(
      pinia,
      { uid: '1', displayName: 'Jane Doe', photoURL: 'bad.jpg' } as AuthUser,
      true,
    )

    const wrapper = createWrapper({}, pinia)

    const img = wrapper.find('.v-img')
    expect(img.exists()).toBe(true)
    await img.trigger('error')
    await flushPromises()
    expect(wrapper.find('.initials').exists()).toBe(true)
    expect(wrapper.find('.initials').text()).toBe('JD')
  })

  it('génère une couleur de fond déterministe (bgColor) avec props.user', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    setupAuthStore(pinia, null, false)

    const wrapper = createWrapper(
      {
        user: { name: 'John Doe', avatarUrl: null },
      },
      pinia,
    )

    const avatar = wrapper.find('.v-avatar')
    const style = avatar.attributes('style')
    expect(style).toMatch(/background: (hsl|rgb)\(/)
  })

  it('applique la classe arrondie correctement', () => {
    const pinia = createTestingPinia()
    const wrapper = createWrapper({ rounded: 'xl' }, pinia)

    // Vérifie la propriété calculée indirectement via la classe
    expect(wrapper.find('.v-avatar').classes()).toContain('rounded-xl')
  })
})
