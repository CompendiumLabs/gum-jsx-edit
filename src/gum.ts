import { available, evaluate, make_request, render_element } from 'gum-jsx-core'
import type { Size } from 'gum-jsx-core'
import * as math from 'gum-jsx-math'

const DEFAULT_CANVAS: Size = Object.freeze({ width: 640, height: 480 })
const fonts = math.createMathFonts()
let fontsReady: Promise<void> | undefined

function loadFonts(): Promise<void> {
  // Share concurrent loads, but allow a later render to retry a failed fetch.
  return fontsReady ??= fonts.load().catch(error => { fontsReady = undefined; throw error })
}

type RenderOptions = {
  idPrefix?: string
  name?: string
  background?: string
  canvas?: Size
}

// Sources that return a plain value show it as text: strings verbatim, the rest as JSON.
export type RenderResult =
  | { kind: 'svg'; svg: string }
  | { kind: 'value'; text: string }

function formatValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? String(value)
}

export async function renderGum(source: string, {
  idPrefix = 'gum-edit',
  name = 'editor.jsx',
  background,
  canvas = DEFAULT_CANVAS,
}: RenderOptions = {}): Promise<RenderResult> {
  await loadFonts()

  const value = evaluate(source, { name, scope: math })
  const result = render_element(value, {
    request: make_request({ width: available(canvas.width), height: available(canvas.height) }),
    viewport: canvas,
    defaults: { theme: 'light' },
    id_prefix: idPrefix,
    background,
    fonts,
  })
  if (result.kind === 'value') return { kind: 'value', text: formatValue(result.value) }
  return { kind: 'svg', svg: result.svg }
}
