import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      theme: {
        defaultTheme: 'light'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['tests/vitest.setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    
    // Completely disable CSS processing
    css: false,
    
    // Handle module resolution
    deps: {
      inline: ['vuetify'],
      external: ['*.css']
    },
    
    // Custom module resolution
    server: {
      deps: {
        inline: ['vuetify']
      }
    },
    
    // Override file handling
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  
  // Add custom plugin for tests to mock CSS
  define: process.env.VITEST ? {
    'import.meta.vitest': 'undefined'
  } : {}
});