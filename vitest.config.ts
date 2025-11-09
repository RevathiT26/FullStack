import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  base: '/', // ensure correct base path
  build: {
    outDir: 'dist',  // Ensure this is set
    emptyOutDir: true
  },
  test: {
    globals: true,
    environment: 'happy-dom', // <- changed from 'jsdom'
    setupFiles: ['tests/vitest.setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/main.ts']
    }
  }
});