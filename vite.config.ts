import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      external: ['vscode', 'fs', 'path', 'os', 'util', 'events', 'stream'],
      output: {
        format: 'cjs',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    target: 'node22',
    ssr: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  ssr: {
    noExternal: true,
  },
});
