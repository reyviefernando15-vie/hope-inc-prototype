import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Hope-inc-prototype/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    }
  }
});