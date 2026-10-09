import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Fonts, Text, Span, px, render_element } from '@gum-jsx/core'
import { loadTextFonts } from '../src/fonts'
import { renderGum } from '../src/gum'

const registered = new Set<MockFace>(), created: MockFace[] = []
let failNext = false
class MockFace {
  status = 'unloaded'
  loads = 0
  pending?: Promise<MockFace>
  constructor(readonly family: string, readonly source: unknown, readonly descriptors: { weight: string; style: string }) {
    created.push(this)
  }
  load(): Promise<MockFace> {
    if (this.status === 'loaded') return Promise.resolve(this)
    if (this.pending) return this.pending
    this.loads++; this.status = 'loading'
    const fail = failNext; failNext = false
    return this.pending = Promise.resolve().then(() => {
      if (fail) { this.status = 'error'; throw new Error('font fetch failed') }
      this.status = 'loaded'; return this
    })
  }
}
const originals = ['document', 'FontFace'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const)
Object.defineProperty(globalThis, 'document', { configurable: true, value: {
  fonts: { add(face: MockFace) { registered.add(face) }, delete(face: MockFace) { return registered.delete(face) } },
} })
Object.defineProperty(globalThis, 'FontFace', { configurable: true, value: MockFace })
try {
  const fonts = new Fonts()
  const element = new Text({ font_size: px(20), children: ['Regular ',
    new Span({ font_weight: 650, children: 'bold' }), ' ',
    new Span({ font_style: 'italic', children: 'italic' }), ' 😀'] })
  const result = render_element(element, { fonts, text_mode: 'live' })
  await Promise.all([loadTextFonts(fonts, result.fragment), loadTextFonts(fonts, result.fragment)])
  assert.equal(registered.size, 6)
  assert.deepEqual(created.filter(face => face.loads).map(face => [face.family, face.descriptors.weight, face.loads]),
    [['IBM Plex Sans', '400', 1], ['IBM Plex Sans', '700', 1]])
  assert.ok(created.every(face => typeof face.source === 'string' && face.source.startsWith('url(')))
  await loadTextFonts(fonts, result.fragment)
  assert.equal(created.length, 6)
  const old = [...registered]
  const bytes = readFileSync(new URL('../../gum-jsx-core/src/fonts/IBMPlexSans-Regular.ttf', import.meta.url))
  fonts.register("Joe's Sans", bytes)
  const custom = render_element(new Text({ font_family: "Joe's Sans", children: 'retry' }), { fonts, text_mode: 'live' })
  failNext = true
  await assert.rejects(loadTextFonts(fonts, custom.fragment), /font fetch failed/)
  assert.ok(old.every(face => !registered.has(face)))
  const failed = [...registered].find(face => face.family === "Joe's Sans")!
  assert.equal(failed.status, 'error')
  assert.ok(failed.source instanceof ArrayBuffer)
  await loadTextFonts(fonts, custom.fragment)
  assert.ok(!registered.has(failed))
  assert.equal([...registered].find(face => face.family === "Joe's Sans")!.status, 'loaded')
  console.log('ok - browser font loading: matching faces, demand loading, concurrent reuse, replacement and retry')
} finally {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else Reflect.deleteProperty(globalThis, name)
  }
}

const prose = await renderGum('<Text>Live <Span font-weight="bold">prose</Span> <Latex>x^2</Latex></Text>')
assert.ok(prose.kind === 'svg')
assert.match(prose.svg, /<text /)
assert.match(prose.svg, /font-weight="700"/)
assert.doesNotMatch(prose.svg, /<path /)
const source = '<Latex>{String.raw`x+\\text{words}`}</Latex>'
const math = await renderGum(source)
assert.ok(math.kind === 'svg')
assert.match(math.svg, /<text /)
assert.doesNotMatch(math.svg, /<path /)
const outlined = await renderGum(source, { textMode: 'path' })
assert.ok(outlined.kind === 'svg')
assert.match(outlined.svg, /<path /)
assert.doesNotMatch(outlined.svg, /<text /)
console.log('ok - editor text mode: one option controls prose and math')
