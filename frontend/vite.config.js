import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Trabalho-1-fullstack/', // Adicione esta linha
  plugins: [react()],
})
