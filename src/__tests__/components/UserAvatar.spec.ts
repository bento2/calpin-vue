import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import type { User as AuthUser } from 'firebase/auth'
import { ref } from 'vue'

// Mock useAuth to prevent auto-reset of user state during tests
vi.mock('@vueuse/firebase/useAuth', () => ({
  useAuth: () => ({
    user: ref(null),
    isAuthenticated: ref(false),
  }),
}))

describe('UserAvatar.vue', () => {
  it("affiche l'avatar de l'utilisateur connecté avec image", async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    const authStore = useAuthStore(pinia)

    // Mock user first
    const user = {
      uid: '123',
      displayName: 'John Doe',
      photoURL: 'https://example.com/photo.jpg',
      email: 'john@example.com',
    } as AuthUser
    authStore.user = user

    // Force isAuthenticated to be writable/mocked for the test
    Object.defineProperty(authStore, 'isAuthenticated', {
      value: true,
      writable: true,
    })

    const wrapper = mount(UserAvatar, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': { template: '<div><slot name="activator" :props="{}"></slot></div>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
          'v-img': {
            template: '<img class="v-img" :src="src" @error="$emit(\'error\')" />',
            props: ['src'],
          },
          'v-icon': true,
        },
      },
    })

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/photo.jpg')
    expect(wrapper.html()).toMatchSnapshot()
  })

  it("affiche les initiales si pas d'image for logged in user", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)

    authStore.user = {
      uid: '123',
      displayName: 'John Doe',
      photoURL: null,
    } as AuthUser

    Object.defineProperty(authStore, 'isAuthenticated', {
      value: true,
      writable: true,
    })

    const wrapper = mount(UserAvatar, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': { template: '<div><slot name="activator" :props="{}"></slot></div>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
          'v-img': true,
          'v-icon': true,
        },
      },
    })

    expect(wrapper.find('.initials').exists()).toBe(true)
    expect(wrapper.find('.initials').text()).toBe('JD')
  })

  it('gère les initiales pour un nom unique (logged in)', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    authStore.user = { displayName: 'Admin', photoURL: null } as AuthUser
    Object.defineProperty(authStore, 'isAuthenticated', {
      value: true,
      writable: true,
    })

    const wrapper = mount(UserAvatar, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': { template: '<div><slot name="activator" :props="{}"></slot></div>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
          'v-img': true,
          'v-icon': true,
        },
      },
    })

    await flushPromises()

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.initials').exists()).toBe(true)
    expect(wrapper.find('.initials').text()).toBe('A')
  })

  it("affiche l'icône anonyme si non connecté et pas de prop user", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)

    // Ensure properly reset
    authStore.user = null
    Object.defineProperty(authStore, 'isAuthenticated', {
      value: false,
      writable: true,
    })
    authStore.login = vi.fn()

    const wrapper = mount(UserAvatar, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': true,
          'v-btn': {
            template: '<button class="login-btn" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
          'v-img': true,
          'v-icon': { template: '<span class="v-icon">icon</span>' },
        },
      },
    })

    expect(wrapper.find('.v-icon').exists()).toBe(true)

    // The component renders two v-btns (outer and inner). The inner one triggers login.
    // Stubs render both as <button class="login-btn">.
    // We want the one inside .v-avatar.
    const innerBtn = wrapper.find('.v-avatar .login-btn')

    expect(innerBtn.exists()).toBe(true)
    await innerBtn.trigger('click')

    expect(authStore.login).toHaveBeenCalled()
  })

  it('utilise la prop user si fournie (mode non connecté)', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    Object.defineProperty(authStore, 'isAuthenticated', {
      value: false,
      writable: true,
    })

    const wrapper = mount(UserAvatar, {
      props: {
        user: {
          name: 'Jane Doe',
          avatarUrl: 'https://example.com/jane.jpg',
        },
      },
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': true,
          'v-btn': { template: '<div><slot /></div>' }, // No interaction needed for this test
          'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
          'v-img': {
            template: '<img class="v-img" :src="src" />',
            props: ['src'],
          },
        },
      },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/jane.jpg')
  })

  it("gère l'erreur de chargement d'image (logged in)", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    authStore.user = { uid: '1', displayName: 'Jane Doe', photoURL: 'bad.jpg' } as AuthUser
    Object.defineProperty(authStore, 'isAuthenticated', {
      value: true,
      writable: true,
    })

    const wrapper = mount(UserAvatar, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': {
            template: '<div><slot name="activator" :props="{}" /></div>',
          },
          'v-btn': { template: '<div><slot /></div>' },
          'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
          'v-img': {
            template: '<img class="v-img-stub" :src="src" @error="$emit(\'error\')" />',
            props: ['src'],
          },
        },
      },
    })

    const img = wrapper.find('.v-img-stub')
    expect(img.exists()).toBe(true)
    await img.trigger('error')
    await flushPromises()
    expect(wrapper.find('.initials').exists()).toBe(true)
    expect(wrapper.find('.initials').text()).toBe('JD')
  })

  it('génère une couleur de fond déterministe (bgColor) avec props.user', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    Object.defineProperty(authStore, 'isAuthenticated', {
      value: false,
      writable: true,
    })

    const wrapper = mount(UserAvatar, {
      props: {
        user: { name: 'John Doe', avatarUrl: null },
      },
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': { template: '<div><slot name="activator" :props="{}"></slot></div>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-avatar': {
            template: '<div class="v-avatar" :style="style"><slot /></div>',
            props: ['style'],
          },
          'v-img': true,
          'v-icon': true,
        },
      },
    })

    const avatar = wrapper.find('.v-avatar')
    const style = avatar.attributes('style')
    expect(style).toMatch(/background: (hsl|rgb)\(/)
  })

  it('applique la classe arrondie correctement', () => {
    const pinia = createTestingPinia()
    const wrapper = mount(UserAvatar, {
      props: { rounded: 'xl' },
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': true,
          // Ensure v-btn renders its slot content, otherwise v-avatar is lost
          'v-btn': { template: '<div><slot /></div>' },
          'v-avatar': {
            template: '<div class="v-avatar" :class="$attrs.class"><slot /></div>',
          },
          'v-img': true,
          'v-icon': true,
        },
      },
    })

    // Check computed property indirectly via class or vm
    expect(wrapper.find('.v-avatar').classes()).toContain('rounded-xl')
  })
})
