import assert from 'node:assert/strict'
import { renderGum } from '../src/gum'

const light = await renderGum('<Text>Default</Text>')
assert.doesNotMatch(light, /<rect\b[^>]*fill=/)
assert.match(light, /<path\b[^>]*fill="black"/)

const dark = await renderGum(`
  <Svg theme="dark" width={px(240)}>
    <VStack>
      <Text>Inherited</Text>
      <Text color="tomato">Explicit</Text>
      <Text theme="light">Nested</Text>
    </VStack>
  </Svg>
`)
assert.match(dark, /<svg\b[^>]*width="240"/)
assert.doesNotMatch(dark, /<rect\b[^>]*fill=/)
for (const fill of ['white', 'tomato', 'black']) {
  assert.match(dark, new RegExp(`<path\\b[^>]*fill="${fill}"`))
}
assert.ok(!dark.includes('theme:'))

const transparent = await renderGum('<Svg theme="dark" background="none"><Text>Clear</Text></Svg>')
assert.doesNotMatch(transparent, /<rect\b[^>]*fill=/)
assert.match(transparent, /<path\b[^>]*fill="white"/)
const painted = await renderGum('<Svg theme="dark"><Text>Backdrop</Text></Svg>', { background: 'navy' })
assert.match(painted, /<rect\b[^>]*fill="navy"/)
assert.match(painted, /<path\b[^>]*fill="white"/)

// Host defaults preserve custom Svg layout descriptors and their extra props.
const custom = await renderGum(`
  class CustomSvg extends Svg {
    static layout(props, query) {
      return Svg.layout({ ...props, background: props.surface }, query)
    }
  }
  return <CustomSvg surface="tomato"><Text>Custom</Text></CustomSvg>
`)
assert.match(custom, /<rect\b[^>]*fill="tomato"/)
console.log('Editor themes passed: defaults, source and paint overrides, transparency, and custom viewports.')
