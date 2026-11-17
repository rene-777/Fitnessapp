import { defineConfig } from 'vitest/config'

// Tests der reinen Logik (lib, data). Ohne die Vite-Plugins der App: kein PWA-Build, kein Tailwind.
export default defineConfig({
  base: '/Fitnessapp/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
