import {
  LayoutPass,
  Svg,
  evaluate,
  render_svg,
} from 'gum-next-core'
import * as math from 'gum-next-math'

const fonts = math.createMathFonts()
let fontsReady: Promise<void> | undefined

function loadFonts(): Promise<void> {
  // Share concurrent loads, but allow a later render to retry a failed fetch.
  return fontsReady ??= fonts.load().catch(error => { fontsReady = undefined; throw error })
}

type RenderOptions = {
  idPrefix?: string
  name?: string
}

export async function renderGum(source: string, {
  idPrefix = 'gum-edit',
  name = 'editor.jsx',
}: RenderOptions = {}): Promise<string> {
  await loadFonts()

  let element = evaluate(source, { name, scope: math })
  if (!(element instanceof Svg)) element = new Svg({ children: element })

  const pass = new LayoutPass({
    fonts: { value: fonts, version: fonts.version },
  })
  const fragment = pass.layout(element)

  return render_svg(fragment, {
    id_prefix: idPrefix,
  })
}
