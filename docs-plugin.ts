import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Plugin, ViteDevServer } from 'vite'
// Run Vite's config host under Bun so the workspace's TypeScript packages and
// font assets share one module identity. Filesystem imports stay in this host.
import { available, evaluate, Fonts, LayoutPass, layout_element, make_request, render_svg } from 'gum-jsx-core'
import * as math from 'gum-jsx-math'
import {
  elementsDir,
  galleryDir,
  listElements,
  listTopics,
  getElementCode,
  getElementText,
  getTopicCode,
  getTopicText,
} from '../gum-jsx-docs/src/index'
import type { Example } from './src/docs-types'

const moduleId = 'virtual:gum-docs'
const resolvedId = '\0' + moduleId
const directories = [elementsDir, galleryDir]
const canvas = { width: 640, height: 480 }

function isContent(file: string): boolean {
  return directories.some(dir => {
    const path = relative(dir, file)
    return /^(?:text|code)[/\\][^/\\]+\.(?:md|jsx)$/.test(path)
  })
}

function refresh(server: ViteDevServer): void {
  const module = server.moduleGraph.getModuleById(resolvedId)
  if (!module) return
  server.moduleGraph.invalidateModule(module)
  server.ws.send({ type: 'full-reload' })
}

export function docsPlugin(): Plugin {
  let build = false
  let base = '/'
  let previews = new Map<string, string>()
  return {
    name: 'gum-docs',
    configResolved(config) {
      build = config.command === 'build'
      base = config.base
    },
    resolveId(id) {
      if (id === moduleId) return resolvedId
    },
    async load(id) {
      if (id !== resolvedId) return
      const entries = [
        ...listElements().map(entry => ({ ...entry, category: entry.cat,
          collection: 'elements' as const, dir: elementsDir })),
        ...listTopics().map(entry => ({ ...entry, category: entry.cat ?? 'showcase',
          collection: 'gallery' as const, dir: galleryDir })),
      ]
      // Vite's config runner imports font assets as browser URLs (/@fs/...).
      // These previews render in the server process, so resolve the assets back
      // to filesystem paths before handing them to the font loader.
      const fonts = new Fonts()
      const faces = await Promise.all(math.MATH_FONTS.map(async name => {
        const asset = await this.resolve(math.MATH_FONT_PATHS[name])
        if (!asset) throw new Error(`Cannot resolve docs font ${name}`)
        return { name, url: pathToFileURL(asset.id) }
      }))
      for (const { name, url } of faces) fonts.register_url(name, url)
      const pass = new LayoutPass({ fonts: { value: fonts, version: fonts.version } })
      const nextPreviews = new Map<string, string>()
      const examples = entries.map(entry => {
        const { name, title, category, collection, dir } = entry
        const file = join(dir, 'code', name + '.jsx')
        this.addWatchFile(file)
        this.addWatchFile(join(dir, 'text', name + '.md'))
        const code = collection === 'gallery' ? getTopicCode(name) : getElementCode(name)
        const markdown = collection === 'gallery' ? getTopicText(name) : getElementText(name)
        const example = { id: collection + '/' + name, name, title, category, collection, markdown, code }
        try {
          // Only trusted, checked-in examples are evaluated. SVG glyph paths make
          // the previews self-contained; the docs page needs no runtime font loading.
          const result = layout_element(evaluate(code, { name: file, scope: math }), {
            pass,
            request: make_request({ width: available(canvas.width), height: available(canvas.height) }),
          })
          if (result.kind !== 'fragment') throw new TypeError('Examples must return an element')
          const { fragment } = result
          const svg = render_svg(fragment, { title, id_prefix: `docs-${collection}-${name}` })
          let image: string
          if (build) {
            const asset = this.emitFile({ type: 'asset', name: `docs-${collection}-${name}.svg`, source: svg })
            image = `import.meta.ROLLUP_FILE_URL_${asset}`
          } else {
            const url = `${base}@gum-docs/${collection}/${name}.svg`
            nextPreviews.set(url, svg)
            image = JSON.stringify(url)
          }
          // Keep large glyph paths out of the JavaScript bundle. The docs preview
          // loads the selected example as a separate image asset.
          return `{...${JSON.stringify(example)},image:${image},error:null}`
        } catch (error) {
          return JSON.stringify({ ...example, image: null,
            error: error instanceof Error ? error.message : String(error) } satisfies Example)
        }
      })
      previews = nextPreviews
      return `export default [${examples.join(',')}];`
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const svg = previews.get(request.url?.split('?')[0] ?? '')
        if (svg === undefined) return next()
        response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
        response.setHeader('Cache-Control', 'no-cache')
        response.end(svg)
      })
      server.watcher.add(directories)
      const onStructureChange = (file: string) => { if (isContent(file)) refresh(server) }
      server.watcher.on('add', onStructureChange)
      server.watcher.on('unlink', onStructureChange)
      server.httpServer?.once('close', () => {
        server.watcher.off('add', onStructureChange)
        server.watcher.off('unlink', onStructureChange)
      })
    },
    handleHotUpdate({ file, server }) {
      if (isContent(file)) {
        refresh(server)
        return []
      }
    },
  }
}
