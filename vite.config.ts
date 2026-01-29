
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Property 'cwd' does not exist on type 'Process' by casting process to any
  // as the Vite config environment executes in Node.js.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    // Vite tidak secara otomatis menyuntikkan process.env ke client.
    // Kita lakukan shim manual untuk API_KEY agar sesuai dengan guideline @google/genai.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000
    }
  };
});
