import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure a single copy of React across all dependencies
    // Prevents dual React instance issues in monorepo setups
    dedupe: ['react', 'react-dom'],
  },
})
