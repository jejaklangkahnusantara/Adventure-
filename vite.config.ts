
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Memuat variabel lingkungan dari sistem (Netlify) dan file .env.
  // Parameter ketiga '' memungkinkan pengambilan variabel tanpa prefix VITE_.
  // Fix: Explicitly import process from node:process to resolve 'Property cwd does not exist on type Process' error.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Menyediakan process.env.API_KEY agar tersedia di dalam kode aplikasi (Gemini SDK).
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      target: 'esnext'
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
