// Aquí configuro el empaquetador Vite para compilar la SPA de Camplink con React,
// habilitar el servidor de desarrollo y redirigir las peticiones de API y medios hacia Django.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/panel-camplink-gestion': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/robots.txt': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
});