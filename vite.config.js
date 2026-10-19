import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: { input: { main: 'index.html', battle: 'battle.html' } },
  },
  server: { port: 5173, host: true },
});
