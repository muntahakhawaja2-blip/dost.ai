import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.config.js/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true // Tells Vite to safely allow our Localtunnel link!
  }
})