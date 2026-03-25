/// <reference types="vitest" />
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const frontendPort = Number(env.FRONTEND_PORT ?? '5173');
  const backendUrl = env.BACKEND_URL ?? `http://localhost:${env.BACKEND_PORT ?? '3000'}`;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
    },
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: backendUrl,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
