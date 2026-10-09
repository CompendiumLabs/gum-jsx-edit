import assert from 'node:assert/strict'
import { THEMES } from '@gum-jsx/core'
import { renderGum } from '../src/gum'

async function svg(...args: Parameters<typeof renderGum>): Promise<string> {
  const result = await renderGum(...args)
  assert.equal(result.kind, 'svg')
  return result.kind === 'svg' ? result.svg : ''
}

const light = await svg('<Text>Default</Text>')
assert.doesNotMatch(light, /<rect\b[^>]*fill=/)
assert.match(light, new RegExp(`<text\\b[^>]*fill="${THEMES.light.foreground}"`))

const dark = await svg(`
  <Page theme="dark" width={px(240)}>
    <VStack>
      <Text>Inherited</Text>
      <Text color="tomato">Explicit</Text>
      <Text theme="light">Nested</Text>
    </VStack>
  </Page>
`)
assert.match(dark, /<svg\b[^>]*width="240"/)
assert.doesNotMatch(dark, /<rect\b[^>]*fill=/)
for (const fill of [THEMES.dark.foreground, 'tomato', THEMES.light.foreground]) {
  assert.match(dark, new RegExp(`<text\\b[^>]*fill="${fill}"`))
}
assert.ok(!dark.includes('theme:'))

const transparent = await svg('<Page theme="dark" background="none"><Text>Clear</Text></Page>')
assert.doesNotMatch(transparent, /<rect\b[^>]*fill=/)
assert.match(transparent, new RegExp(`<text\\b[^>]*fill="${THEMES.dark.foreground}"`))
const painted = await svg('<Page theme="dark"><Text>Backdrop</Text></Page>', { background: 'navy' })
assert.match(painted, /<rect\b[^>]*fill="navy"/)
assert.match(painted, new RegExp(`<text\\b[^>]*fill="${THEMES.dark.foreground}"`))

// Host defaults preserve custom Page layout descriptors and their extra props.
const custom = await svg(`
  class CustomPage extends Page {
    static layout(props, query) {
      return Page.layout({ ...props, background: props.surface }, query)
    }
  }
  return <CustomPage surface="tomato"><Text>Custom</Text></CustomPage>
`)
assert.match(custom, /<rect\b[^>]*fill="tomato"/)

const value = await renderGum('const total = 2 + 3\nreturn { total }')
assert.deepEqual(value, { kind: 'value', text: '{\n  "total": 5\n}' })
console.log('ok - editor themes: defaults, source and paint overrides, transparency, and custom viewports')
