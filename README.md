# gum-edit

A small two-pane live editor for the in-development `gum-jsx-core` package. JSX is evaluated locally in the browser and rendered directly to SVG.

From the parent workspace:

```sh
bun install
bun run dev
```

The source is saved in browser local storage. A valid render can be copied or downloaded as an SVG file.

Rendering defaults to a light theme. Set `<Svg theme="dark">` to render with the
dark palette; explicit colors remain fixed, while paints such as `theme:accent`
follow the selection. The starter includes `theme="light"` so it can be changed
directly. Exports are transparent unless source props explicitly paint a background. See
[Themes](../gum-jsx-docs/docs/gallery/text/Themes.md) for palette colors and inheritance.

## Emoji

Emoji work in plain text, such as `<Text>Ship it 🚀</Text>`. Core measures them
with its bundled metrics face and keeps them as live SVG text in the family
`Noto Color Emoji`, so the editor only has to paint that family. The `@font-face`
rule in `src/index.css` does so with the complete web font from
`@fontsource/noto-color-emoji`. That file is several megabytes, and the browser
fetches it only once a rendered figure contains an emoji. Keep the family out of
the UI font stacks so ordinary page text never triggers the download.

A copied or downloaded SVG names the same family. A viewer without it installed
falls back to its own emoji font, and each emoji stays centered in its measured slot.
Docs previews are isolated images, so they always use the viewer's emoji font.

## Docs showcase

The editor's Docs link opens `/docs`: a searchable, category-filtered grid of the
reference examples and showcases from `gum-jsx-docs`. Each card opens a modal
with editable, wrapping, highlighted JSX beside its live figure. Edits are
rendered locally after a short debounce. On narrow screens the two panes stack.
Close with the button, Escape, or the backdrop; focus returns to the card.
Browsing examples never replaces the saved editor source.

Selecting a doc updates the URL (for example, `/docs?doc=elements%2FBox`).
Reloading or opening a shared URL restores that doc and its collection; browser
Back and Forward follow the navigation history. Collection tabs also persist in
the URL, and an unknown doc falls back to the initial Svg example.

The Vite plugin uses the docs package's catalog loaders and renders the trusted
examples to SVG during development/build. Previews contain their own glyph paths
and are displayed as isolated images, so the docs route needs no browser layout
or font loading. Changes to paired Markdown/JSX files refresh the development
page. No generated preview files need to be committed.

SVGs are separate, lazily loaded assets in production, and the code editor loads
when a popup is opened. The browser rendering engine is loaded only if an example
is edited. The scripts use Vite's config runner to load the TypeScript-only
workspace packages used by the preview generator.

Run `bun --filter @gum-jsx/docs test` from the parent workspace to validate the
content, `bun --filter @gum-jsx/edit test` to test editor behavior and render every
preview through Vite's development config runner, and `bun --filter @gum-jsx/edit build`
to build both routes. Tests live in `test/`; run `bun run test` from this package
to execute them. Both suites are included in the workspace's `bun run test`. Use
`bun --filter @gum-jsx/edit preview` to serve that build locally. Production
hosting should fall back to `index.html` for `/docs` (and `/docs/`), as Vite's dev
and preview servers do. Routes respect Vite's configured base path.
