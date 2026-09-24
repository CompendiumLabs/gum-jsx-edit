import assert from 'node:assert/strict'
import { EMOJI_FAMILY } from '@gum-jsx/core'
import { renderGum } from '../src/gum'

// Plain text needs no Span: Plex keeps its outlines, and each emoji sequence
// becomes one live text node. The SVG viewer chooses an available emoji font.
const source = '<Text>Ship it \u{1f680} \u{1f468}‍\u{1f469}‍\u{1f467} 1️⃣ \u{1f1fa}\u{1f1f8}</Text>'
const result = await renderGum(source)
assert.equal(result.kind, 'svg')
const svg = result.kind === 'svg' ? result.svg : ''
const live = [...svg.matchAll(/<text [^>]*font-family="&apos;([^"]*)&apos;"[^>]*>([^<]*)<\/text>/g)]
assert.deepEqual(live.map(match => match[2]),
  ['\u{1f680}', '\u{1f468}‍\u{1f469}‍\u{1f467}', '1️⃣', '\u{1f1fa}\u{1f1f8}'])
assert.ok(live.every(match => match[1] === EMOJI_FAMILY))
assert.match(svg, /<path d="M/)

// Text that neither Plex nor the bundled emoji metrics face covers still fails.
await assert.rejects(renderGum('<Text>\u{10ffff}</Text>'), /IBM Plex Sans has no glyph for U\+10FFFF/)
console.log('Emoji check passed: live text for emoji, outlines elsewhere.')
