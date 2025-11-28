import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
    },
    setupFiles: ['./test/setup.ts'],
    globals: true,
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    // Ignore CSS imports
    css: {
      include: /.+/,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Mock CSS files
      '\\.(css|less|scss|sass)$': fileURLToPath(
        new URL('./test/mocks/fileMock.js', import.meta.url),
      ),
    },
  },
})
