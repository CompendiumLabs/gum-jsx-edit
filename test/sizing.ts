import assert from 'node:assert/strict'
import { renderGum } from '../src/gum'

// Authored dimensions and typography describe a stable figure for display scaling.
const source = `
  <Group height={px(550)} aspect={1.3} font-size={px(18)}>
    <Text x={0.5} y={0.5} anchor="center">Design size</Text>
    <Rect width={em(2)} height={em(1)} />
  </Group>
`
const designed = await renderGum(source)
assert.equal(designed.kind, 'svg')
if (designed.kind === 'svg') assert.match(designed.svg, /viewBox="0 0 715 550"/)
for (const canvas of [{ width: 320, height: 240 }, { width: 960, height: 720 }]) {
  assert.deepEqual(await renderGum(source, { canvas }), designed)
}

// Unsized figures can still use the host's available space.
const canvas = { width: 300, height: 200 }
assert.deepEqual(await renderGum('<Rect />', { canvas }),
  await renderGum('<Rect width={px(300)} height={px(200)} />', { canvas }))
await assert.rejects(renderGum('<Text>Invalid</Text>', { canvas: { width: 640, height: -1 } }), /nonnegative/)

console.log('Editor sizing passed: authored dimensions and typography, available space, and invalid bounds.')
