import {
  Fonts,
  LayoutPass,
  Svg,
  evaluate,
  render_svg,
} from 'gum-next-core'

const fonts = new Fonts()
const fontsReady = fonts.load()

export async function renderGum(source: string): Promise<string> {
  await fontsReady

  let element = evaluate(source, { name: 'editor.jsx' })
  if (!(element instanceof Svg)) element = new Svg({ children: element })

  const pass = new LayoutPass({
    fonts: { value: fonts, version: fonts.version },
  })
  const fragment = pass.layout(element)

  return render_svg(fragment, {
    id_prefix: 'gum-edit',
  })
}
