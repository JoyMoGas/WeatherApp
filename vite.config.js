import { defineConfig } from "vite";

export default defineConfig({
  // Vite automatically loads .env files and exposes variables prefixed with VITE_
  // to import.meta.env
  server: {
    port: 5173,
    host: true, // Permite acceso desde la red local (móviles)
    https: false, // Cambiar a true si necesitas HTTPS para geolocalización en móviles
  },
});
