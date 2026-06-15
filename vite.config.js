import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test-setup.js', 'src/**/*.test.{js,jsx}'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
})
