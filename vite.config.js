import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const scriptUrl = env.VITE_GOOGLE_SHEETS_SCRIPT_URL || '';
  const scriptPathMatch = scriptUrl.match(/\/macros\/s\/[^/]+\/exec/);
  const scriptPath = scriptPathMatch ? scriptPathMatch[0] : '/macros/s/AKfycbyyZOnw2jj_wm3uJuFB_uvRZFY8o9RuhOmtik7cW8UenXqpOqmc1rRKtRrfBes3AS9e7g/exec';

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [react()],
    server: {
      proxy: {
        '/api/google-sheets': {
          target: 'https://script.google.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/google-sheets/, scriptPath),
        },
      },
    },
  };
});
