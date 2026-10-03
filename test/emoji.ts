import assert from 'node:assert/strict'
import { EMOJI_FAMILY } from '@gum-jsx/core'
import { renderGum } from '../src/gum'

// Ordinary prose and emoji use live text. Emoji still uses one node per
// sequence, measured by the metrics face and painted by a host color font.
const source = '<Text>Ship it \u{1f680} \u{1f468}‍\u{1f469}‍\u{1f467} 1️⃣ \u{1f1fa}\u{1f1f8}</Text>'
const result = await renderGum(source)
assert.equal(result.kind, 'svg')
const svg = result.kind === 'svg' ? result.svg : ''
const live = [...svg.matchAll(/<text [^>]*font-family="([^"]*)"[^>]*>(.*?)<\/text>/g)]
assert.deepEqual(live.filter(match => match[1] === EMOJI_FAMILY).map(match => match[2]),
  ['\u{1f680}', '\u{1f468}‍\u{1f469}‍\u{1f467}', '1️⃣', '\u{1f1fa}\u{1f1f8}'])
const prose = live.filter(match => match[1] !== EMOJI_FAMILY)
assert.equal(prose.length, 1)
assert.deepEqual([...prose[0][2].matchAll(/<tspan [^>]*>([^<]*)<\/tspan>/g)].map(match => match[1]), ['Ship ', 'it '])
assert.doesNotMatch(svg, /<path /)
const outlined = await renderGum(source, { textMode: 'path' })
assert.ok(outlined.kind === 'svg' && outlined.svg.includes('<path '))

// Text that neither Plex nor the bundled emoji metrics face covers still fails.
await assert.rejects(renderGum('<Text>\u{10ffff}</Text>'), /IBM Plex Sans has no glyph for U\+10FFFF/)
console.log('Emoji check passed: live prose by default, color emoji retained in both modes.')
