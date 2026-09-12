/// <reference types="vite/client" />

declare module 'virtual:gum-docs' {
  const examples: readonly import('./docs-types').Example[]
  export default examples
}
