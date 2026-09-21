import assert from 'node:assert/strict'
import { renderGum } from '../src/gum'

type Options = NonNullable<Parameters<typeof renderGum>[1]>

async function equivalent(source: string, expected: string, options: Options = {}) {
  const actual = await renderGum(source, options)
  assert.equal(actual.kind, 'svg')
  assert.deepEqual(actual, await renderGum(expected, options))
}

// Studio's logical canvas provides reference pixels without allocating output space.
await equivalent('<Text font-size="4vh">Root font</Text>', '<Text font-size={vh(4)}>Root font</Text>')
await equivalent('<Rect width="25vw" height="10vh" />', '<Rect width={vw(25)} height={vh(10)} />')
await equivalent('<Text font-size={vh(4)}>Root font</Text>', '<Text font-size={px(19.2)}>Root font</Text>')
await equivalent('<Rect width={vw(25)} height={vh(10)} />', '<Rect width={px(160)} height={px(48)} />')
await equivalent(`
  <Svg max-width={px(320)} max-height={px(200)} font-size={vh(4)}>
    <Text>Content-sized</Text>
  </Svg>
`, `
  <Svg max-width={px(320)} max-height={px(200)} font-size={px(19.2)}>
    <Text>Content-sized</Text>
  </Svg>
`)

// Definite source dimensions, including aspect-derived axes, beat Studio's fallback.
await equivalent(`
  <Svg width={px(800)} aspect={2} font-size={vh(4)}>
    <Text>Authored size</Text>
  </Svg>
`, `
  <Svg width={px(800)} aspect={2} font-size={px(16)}>
    <Text>Authored size</Text>
  </Svg>
`)
await equivalent(`
  <Svg width={px(800)}>
    <Rect width={vw(25)} height={vh(10)} />
  </Svg>
`, `
  <Svg width={px(800)}>
    <Rect width={px(200)} height={px(48)} />
  </Svg>
`)

// Explicit references have the highest source priority, independently on each axis.
await equivalent(`
  <Svg viewport={{ height: 600 }} height={px(200)} font-size={vh(4)}>
    <Text>Reference canvas</Text>
  </Svg>
`, `
  <Svg viewport={{ height: 600 }} height={px(200)} font-size={px(24)}>
    <Text>Reference canvas</Text>
  </Svg>
`)
await equivalent('<Rect viewport={{ width: 400 }} width={vw(25)} height={vh(10)} />',
  '<Rect viewport={{ width: 400 }} width={px(100)} height={px(48)} />')

// The same configurable canvas supplies layout offers and unit references.
for (const height of [240, 600]) {
  await equivalent('<Text font-size={vh(4)}>Resized</Text>', `<Text font-size={px(${height * 0.04})}>Resized</Text>`,
    { canvas: { width: 800, height } })
}
await equivalent('<Rect width={vw(25)} height={vh(10)} />', '<Rect width={px(200)} height={px(60)} />',
  { canvas: { width: 800, height: 600 } })
await equivalent('<Rect />', '<Rect width={px(300)} height={px(200)} />',
  { canvas: { width: 300, height: 200 } })
await assert.rejects(renderGum('<Text>Invalid</Text>', { canvas: { width: 640, height: -1 } }), /nonnegative/)

console.log('Editor viewport checks passed: canvas fallback, source precedence, root fonts, and canvas resizing.')
