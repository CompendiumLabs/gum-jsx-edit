import {
  LayoutPass,
  Svg,
  evaluate,
  render_svg,
} from 'gum-jsx-core'
import * as math from 'gum-jsx-math'

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
}

export async function renderGum(source: string, {
  idPrefix = 'gum-edit',
  name = 'editor.jsx',
  background,
}: RenderOptions = {}): Promise<string> {
  await loadFonts()

  const element = evaluate(source, { name, scope: math })
  const viewport = element instanceof Svg ? element : new Svg({ children: element })
  const root = new Svg(viewport.type, { ...viewport.props, theme: viewport.props.theme ?? 'light' })

  const pass = new LayoutPass({
    fonts: { value: fonts, version: fonts.version },
  })
  const fragment = pass.layout(root)

  return render_svg(fragment, {
    id_prefix: idPrefix,
    background,
  })
}
