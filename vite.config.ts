import { createRequire } from 'node:module'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const coreRequire = createRequire(require.resolve('@gum-jsx/core'))

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // acorn-jsx requires Acorn's CJS entry. Share it in production; Vite's
  // development module runner needs the ESM entry for Gum's parser.
  resolve: command === 'build'
    ? { alias: [{ find: /^acorn$/, replacement: coreRequire.resolve('acorn') }] }
    : undefined,
  // Element descriptors derive their diagnostic names from the classes.
  build: { rolldownOptions: { output: { keepNames: true } } },
  worker: { rolldownOptions: { output: { keepNames: true } } },
}))
