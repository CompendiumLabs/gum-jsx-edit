import {
  Fonts,
  LayoutPass,
  Svg,
  evaluate,
  render_svg,
} from 'gum-next-core'

const fonts = new Fonts()
const fontsReady = fonts.load()

type RenderOptions = {
  idPrefix?: string
  name?: string
}

export async function renderGum(source: string, {
  idPrefix = 'gum-edit',
  name = 'editor.jsx',
}: RenderOptions = {}): Promise<string> {
  await fontsReady

  let element = evaluate(source, { name })
  if (!(element instanceof Svg)) element = new Svg({ children: element })

  const pass = new LayoutPass({
    fonts: { value: fonts, version: fonts.version },
  })
  const fragment = pass.layout(element)

  return render_svg(fragment, {
    id_prefix: idPrefix,
  })
}
