# gum-edit

A small two-pane live editor for the in-development `gum-next-core` package. JSX is evaluated locally in the browser and rendered directly to SVG.

From the parent workspace:

```sh
bun install
bun run dev
```

The source is saved in browser local storage. A valid render can be copied or downloaded as an SVG file.

## Docs showcase

The editor's Docs link opens `/docs`: a searchable, category-filtered grid of the
reference examples and showcases from `gum-next-docs`. Each card opens a modal
with editable, wrapping, highlighted JSX beside its live figure. Edits are
rendered locally after a short debounce. On narrow screens the two panes stack.
Close with the button, Escape, or the backdrop; focus returns to the card.
Browsing examples never replaces the saved editor source.

The Vite plugin uses the docs package's catalog loaders and renders the trusted
examples to SVG during development/build. Previews contain their own glyph paths
and are displayed as isolated images, so the docs route needs no browser layout
or font loading. Changes to paired Markdown/JSX files refresh the development
page. No generated preview files need to be committed.

SVGs are separate, lazily loaded assets in production, and the code editor loads
when a popup is opened. The browser rendering engine is loaded only if an example
is edited. The scripts use Vite's config runner to load the TypeScript-only
workspace packages used by the preview generator.

Run `bun --filter gum-next-docs check` from the parent workspace to validate the
content, and `bun --filter gum-next-edit build` to build both routes. Use
`bun --filter gum-next-edit preview` to serve that build locally. Production
hosting should fall back to `index.html` for `/docs` (and `/docs/`), as Vite's dev
and preview servers do. Routes respect Vite's configured base path.
