import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { listElements, listTopics } from '../../gum-jsx-docs/src'
import type { Example } from '../src/docs-types'

const expectedIds = [
  ...listElements().map(entry => `elements/${entry.name}`),
  ...listTopics().map(entry => `gallery/${entry.name}`),
].sort()

// Load the actual Vite configuration: importing docsPlugin directly under Bun
// would bypass the config runner's asset URL handling and miss font regressions.
for (const base of ['/', '/preview/']) {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configLoader: 'runner',
    base,
    logLevel: 'error',
    server: { middlewareMode: true, watch: null, ws: false },
  })
  try {
    const examples = (await server.ssrLoadModule('virtual:gum-docs')).default as Example[]
    assert.deepEqual(examples.map(example => example.id).sort(), expectedIds)
    for (const example of examples) {
      assert.equal(example.error, null, `${example.id}: ${example.error}`)
      assert.equal(example.image, `${base}@gum-docs/${example.id}.svg`,
        `${example.id}: missing preview or incorrect base path`)
    }
    console.log(`Docs development check passed: ${examples.length} previews at ${base}`)
  } finally {
    await server.close()
  }
}
