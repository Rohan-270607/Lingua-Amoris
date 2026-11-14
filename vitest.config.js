import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate from vite.config.js so the tests never load the Tailwind plugin.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['test/**/*.test.{js,jsx}'],
    setupFiles: ['test/setup.js'],
  },
})
