import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAuthStore } from '@/stores/useAuthStore'

describe('UserAvatar', () => {
  const createWrapper = (props = {}) => {
    const wrapper = mount(UserAvatar, {
      props: {
        size: 40,
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        stubs: {
          'v-avatar': {
            template: '<div class="v-avatar"><slot /></div>',
          },
          'v-img': {
            template: '<img />',
          },
          'v-icon': {
            template: '<span class="v-icon"><slot /></span>',
          },
          'v-btn': {
            template: '<button><slot /></button>',
          },
          'v-tooltip': {
            template: '<div><slot name="activator" :props="{}" /><slot /></div>',
          },
        },
      },
    })
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders avatar', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays anonymous icon when not authenticated', () => {
    const wrapper = createWrapper()
    const authStore = useAuthStore()
    authStore.user = null

    expect(wrapper.html()).toContain('mdi-account')
  })
})
