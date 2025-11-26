import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/webview/__tests__/setup.ts'],
    include: ['src/webview/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/webview/**/*.{ts,tsx}'],
      exclude: ['src/webview/__tests__/**', 'src/webview/main.tsx'],
    },
  },
});
