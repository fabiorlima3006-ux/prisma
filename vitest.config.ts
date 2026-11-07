import { fileURLToPath } from 'node:url';
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [{ enforce: 'pre', ...mdx() }, react()],
  resolve: {
    alias: {
      '@': resolve('./src'),
      'server-only': resolve('./src/test/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    globals: false,
  },
});
