import assert from 'node:assert/strict'
import { EditorState } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { mathCompletions, mathCompletionSource } from '../src/completions'

async function completion(doc: string) {
  const state = EditorState.create({ doc, extensions: [javascript({ jsx: true }), mathCompletions] })
  assert.ok(state.languageDataAt('autocomplete', doc.length).includes(mathCompletionSource))
  // The scope source only needs these three CompletionContext fields.
  return await mathCompletionSource({ state, pos: doc.length, explicit: false } as Parameters<typeof mathCompletionSource>[0])
}
for (const [doc, name] of [['<Lat', 'Latex'], ['<MathAr', 'MathArray'], ['<XArr', 'XArrow'],
  ['return mathToEl', 'mathToElement'], ['const face = mathb', 'mathbb']]) {
  const result = await completion(doc)
  assert.ok(result, `${doc}: missing completions`)
  assert.ok(result.options.some(option => option.label === name), `${doc}: missing ${name}`)
  assert.equal(result.from, doc.search(/[A-Za-z]+$/))
}
for (const doc of ['// mathToEl', '"mathToEl', 'String.raw`\\mathb', '<Latex>abc', 'Math.']) {
  const result = await completion(doc)
  assert.ok(!result?.options.some(option => option.label === 'mathToElement'), `${doc}: inappropriate math completion`)
}
console.log('Math completions passed: JSX elements, helper functions, font aliases, and non-code contexts.')
