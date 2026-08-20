import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** 프로젝트 테스트용 단일 HTML 산출 (dist-single/index.html 하나로 완결) */
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    target: 'es2022',
    outDir: 'dist-single',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
