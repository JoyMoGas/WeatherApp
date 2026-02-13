import { defineConfig } from 'vite'

export default defineConfig({
  // Vite automatically loads .env files and exposes variables prefixed with VITE_
  // to import.meta.env
  server: {
    port: 5500
  }
})
