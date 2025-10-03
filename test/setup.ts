// test/setup.ts
import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Polyfills pour jsdom
import { TextEncoder, TextDecoder } from 'util'
import { vi } from 'vitest'

global.TextEncoder = global.TextEncoder || TextEncoder
global.TextDecoder = global.TextDecoder || TextDecoder

// Mocks nécessaires
global.ResizeObserver = global.ResizeObserver || class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Créer une instance Vuetify propre pour les tests
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light'
  }
})

// Configuration globale - éviter la double registration
config.global.plugins = [vuetify]

// NE PAS ajouter les composants globalement ici car ils sont déjà dans le plugin
// config.global.components = components // <- Retirer cette ligne

config.global.stubs = {
  transition: false,
  'transition-group': false,
}
