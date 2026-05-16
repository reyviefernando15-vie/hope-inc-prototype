import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hope-inc-prototype/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    }
  }
});