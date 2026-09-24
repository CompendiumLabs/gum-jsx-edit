# @gum-jsx/edit

A basic browser editor example for Gum figures. It evaluates JSX locally and
shows a live SVG preview. The app uses React, CodeMirror, and Vite, and saves
the source in browser local storage.

See the [Gum project](https://github.com/CompendiumLabs/gum-jsx#readme) for
getting started and the package overview. Reference documentation and examples
live in `gum-jsx-docs`.

## Run locally

From the parent workspace:

```sh
bun run dev
```

Open the URL printed by Vite.

Rendering defaults to a light theme. Set `<Svg theme="dark">` to render with the
dark palette; explicit colors remain fixed, while paints such as `theme:accent`
follow the selection. The starter includes `theme="light"` so it can be changed
directly. See
[Themes](https://github.com/CompendiumLabs/gum-jsx-docs/blob/master/docs/guides/text/themes.md)
for palette colors and inheritance.

## Checks

Run `bun --filter @gum-jsx/edit test` to test editor behavior and
`bun --filter @gum-jsx/edit build` to typecheck and build the app. Tests live in
`test/` and are included in the workspace's `bun run test`.
