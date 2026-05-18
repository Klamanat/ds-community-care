import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/__tests__/**/*.test.js'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'clover'],
      include: ['src/**'],
      exclude: [
        'src/__tests__/**',
        'src/**/*.test.js',
        'src/**/*.spec.js',
        'src/main.js',
      ],
      reportsDirectory: './coverage',
      watermarks: {
        statements: [70, 90],
        branches: [60, 85],
        functions: [70, 90],
        lines: [70, 90],
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
