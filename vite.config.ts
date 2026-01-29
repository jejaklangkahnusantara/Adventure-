
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Memuat variabel lingkungan dari direktori kerja saat ini.
  // Argumen ketiga '' memungkinkan pemuatan variabel tanpa awalan VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Menentukan process.env.API_KEY untuk kompatibilitas dengan panggilan layanan Gemini yang ada.
      // Ini memastikan bahwa kode sisi klien dapat mengakses variabel lingkungan Netlify.
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
