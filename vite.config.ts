import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
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
  build: {
    rolldownOptions: {
      // Keep the renderer importable without mounting the editor. The browser
      // regression exercises this entry from the same production build.
      input: {
        editor: fileURLToPath(new URL('./index.html', import.meta.url)),
        gum: fileURLToPath(new URL('./src/gum.ts', import.meta.url)),
      },
      preserveEntrySignatures: 'strict',
      // Element descriptors derive their diagnostic names from the classes.
      output: { keepNames: true },
    },
  },
  worker: { rolldownOptions: { output: { keepNames: true } } },
}))
