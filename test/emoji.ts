import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EMOJI_FAMILY } from 'gum-jsx-core'
import { renderGum } from '../src/gum'

// Plain text needs no Span: Plex keeps its outlines, and each emoji sequence
// becomes one live text node in the family that the page's web font supplies.
const source = '<Text>Ship it \u{1f680} \u{1f468}‍\u{1f469}‍\u{1f467} 1️⃣ \u{1f1fa}\u{1f1f8}</Text>'
const result = await renderGum(source)
assert.equal(result.kind, 'svg')
const svg = result.kind === 'svg' ? result.svg : ''
const live = [...svg.matchAll(/<text [^>]*font-family="&apos;([^"]*)&apos;"[^>]*>([^<]*)<\/text>/g)]
assert.deepEqual(live.map(match => match[2]),
  ['\u{1f680}', '\u{1f468}‍\u{1f469}‍\u{1f467}', '1️⃣', '\u{1f1fa}\u{1f1f8}'])
assert.ok(live.every(match => match[1] === EMOJI_FAMILY))
assert.match(svg, /<path d="M/)

// Core measures emoji with its bundled metrics face and names this family on the
// live text. The stylesheet must load the same family, or the browser substitutes its own.
// Only the complete face has COLR layers; Chrome draws the SVG-only slices blank.
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const face = /@font-face \{[^}]*\}/.exec(css)?.[0] ?? ''
assert.ok(face.includes(`font-family: '${EMOJI_FAMILY}'`))
assert.match(face, /noto-color-emoji-emoji-400-normal\.woff2/)

// Text that neither Plex nor the emoji face covers still fails loudly.
await assert.rejects(renderGum('<Text>\u{10ffff}</Text>'), /IBM Plex Sans has no glyph for U\+10FFFF/)
console.log('Emoji check passed: live text in the web font family, outlines elsewhere.')
