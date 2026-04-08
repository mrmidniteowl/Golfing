import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ============================================
// CHANGE THIS to match your GitHub repo name!
// e.g., '/Golfing/' for github.com/user/Golfing
// Set to '/' for local development
// ============================================
const GITHUB_REPO_NAME = '/Golfing/'

export default defineConfig({
  base: GITHUB_REPO_NAME,
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
})
