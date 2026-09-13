import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { docsPlugin } from './docs-plugin'

export default defineConfig({
  plugins: [docsPlugin(), react(), tailwindcss()],
  // Element descriptors derive their diagnostic names from the classes.
  build: { rolldownOptions: { output: { keepNames: true } } },
  worker: { rolldownOptions: { output: { keepNames: true } } },
})
