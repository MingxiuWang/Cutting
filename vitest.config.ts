import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { config as dotenv } from 'dotenv';

dotenv({ path: '.env.local' });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'test-secret',
      AUTH_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
