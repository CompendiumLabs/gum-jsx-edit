import assert from 'node:assert/strict'
import { renderGum } from '../src/gum'

// Authored dimensions and typography describe a stable figure for display scaling.
const source = `
  <Group height={px(550)} aspect={1.3} font-size={px(18)}>
    <Text pos={[0.5, 0.5]} anchor="center">Design size</Text>
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

// Editor evaluation preserves named records in samplers and annotation spreads.
const coordinates = `
  const point = {theta: 0, r: 1}
  return <Graph xlim={[-2, 2]} ylim={[-2, 2]} projection={({theta, r}) => ({x: r * cos(theta), y: r * sin(theta)})}>
    <Rect {...{pos: point}} width={px(4)} height={px(6)} />
    <SymLine f={theta => ({theta, r: 1})} tvals={[0, 1]} />
  </Graph>
`
const cartesian = `
  <Graph xlim={[-2, 2]} ylim={[-2, 2]}>
    <Rect pos={[1, 0]} width={px(4)} height={px(6)} />
    <SymLine f={theta => [cos(theta), sin(theta)]} tvals={[0, 1]} />
  </Graph>
`
assert.deepEqual(await renderGum(coordinates, { canvas }), await renderGum(cartesian, { canvas }))
const map = `<GeoMap source={world_countries({ids: []})} width={px(120)} height={px(80)}>
  <Points points={[{lon: 30, lat: 20}]} point-size={px(6)} />
</GeoMap>`
assert.deepEqual(await renderGum(map), await renderGum(map.replace('{lon: 30, lat: 20}', '[30, 20]')))

console.log('ok - editor sizing: authored dimensions, available space, named coordinates, and invalid dimensions')
