import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/html/*',
          dest: 'src/html',
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  ssr: {
    noExternal: true,
  },
});
