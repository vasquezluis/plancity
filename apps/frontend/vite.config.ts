import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load .env from the monorepo root (two levels up from apps/frontend)
  const env = loadEnv(mode, '../../', '');

  const backendPort = env.PORT ?? '3001';
  const frontendPort = Number(env.FRONTEND_PORT ?? '3000');

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        // Proxy API calls to the backend during development
        '/api': {
          target: `http://localhost:${backendPort}`,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
