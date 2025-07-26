import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/submit': 'http://localhost:8080',
      '/line_ai': 'http://localhost:8080',
      '/full_ai': 'http://localhost:8080',
      '/explain': 'http://localhost:8080',
      '/bug_fix': 'http://localhost:8080',
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
