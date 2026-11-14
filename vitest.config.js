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
    // Vitest would otherwise read the repo's .env and point shared-mode code at the
    // live Supabase project. Blank here, tests that want shared mode mock the client.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
})
