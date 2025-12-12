import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAuthStore } from '@/stores/useAuthStore'

describe('UserAvatar.vue', () => {
  it("affiche l'avatar de l'utilisateur connecté avec image", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    // @ts-expect-error - mock property
    authStore.isAuthenticated = true
    // @ts-expect-error
    authStore.user = {
      uid: '123',
      displayName: 'John Doe',
      photoURL: 'https://example.com/photo.jpg',
      email: 'john@example.com',
    }

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

  it("affiche les initiales si pas d'image", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    // @ts-expect-error
    authStore.isAuthenticated = true
    // @ts-expect-error
    authStore.user = {
      uid: '123',
      displayName: 'John Doe',
      photoURL: null,
    }

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

  it("affiche l'icône anonyme si non connecté", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    // @ts-expect-error
    authStore.isAuthenticated = false
    authStore.user = null
    // Explicitly mock login
    authStore.login = vi.fn()

    const wrapper = mount(UserAvatar, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': true, // v-tooltip not rendered if !isAuthenticated (actually v-if=isAuthenticated on tooltip)
          // Wait, template structure:
          // <v-tooltip v-if="auth.isAuthenticated">...</v-tooltip>
          // <v-btn v-else>...</v-btn>
          'v-btn': {
            template: '<button class="stub-btn" @click="$emit(\'click\')"><slot /></button>',
          },
          'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
          'v-img': true,
          'v-icon': { template: '<span class="v-icon">icon</span>' },
        },
      },
    })

    console.log(wrapper.html())

    // Check if anonymous state is rendered
    expect(wrapper.find('.v-icon').exists()).toBe(true)

    // Find the button that triggers login.
    // In UserAvatar: <v-btn v-else> ... <v-btn @click="auth.login()">
    // We have nested buttons.
    // The inner button triggers login.
    const buttons = wrapper.findAll('button')
    // Logic: finding the button that presumably wraps the icon
    const loginBtn = buttons[buttons.length - 1]

    await loginBtn.trigger('click')
    expect(authStore.login).toHaveBeenCalled()
  })

  it("gère l'erreur de chargement d'image", async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const authStore = useAuthStore(pinia)
    // Fix type usage without casting to any if possible, or use proper cast
    Object.defineProperty(authStore, 'isAuthenticated', { value: true, writable: true })
    Object.defineProperty(authStore, 'user', {
      value: { uid: '1', displayName: 'Jane Doe', photoURL: 'bad.jpg' },
      writable: true,
    })

    const wrapper = mount(UserAvatar, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-tooltip': {
            template: '<div><slot name="activator" v-bind="{ props: {} }"></slot></div>',
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

    // Debug info
    console.log(wrapper.html())

    // Find the img stub
    const img = wrapper.find('.v-img-stub')
    expect(img.exists()).toBe(true)

    await img.trigger('error')

    // Force reactivity update if needed
    await wrapper.vm.$nextTick()

    console.log('After error HTML:', wrapper.html())

    // Should fallback to initials/icon
    expect(wrapper.find('.initials').exists()).toBe(true)
    expect(wrapper.find('.initials').text()).toBe('JD')
  })
})
