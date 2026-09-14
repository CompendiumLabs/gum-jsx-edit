import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { marked } from 'marked'
import examples from 'virtual:gum-docs'
import type { Example } from './docs-types'
import { Pane } from './Utils'

const categories = [
  ['core', 'Getting started'],
  ['layout', 'Layout'],
  ['geometry', 'Geometry'],
  ['plotting', 'Plotting'],
  ['text', 'Text'],
  ['api', 'API'],
  ['showcase', 'Showcases'],
] as const
const sections = [
  ['elements', 'Elements'],
  ['topics', 'Topics'],
] as const
const CodeEditor = lazy(() => import('./CodeEditor'))
const examplesByMarkdownPath = new Map(examples.map(entry => [
  `/${entry.collection}/text/${entry.name}.md`,
  entry,
]))

function compareEntries(a: Example, b: Example): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

function message(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function Figure({ entry }: { entry: Example }) {
  const [failed, setFailed] = useState(false)
  if (!entry.image || failed) {
    return (
      <p className="max-w-full whitespace-pre-wrap break-words p-4 text-sm text-red-800">
        {entry.error ?? 'Unable to display this SVG.'}
      </p>
    )
  }
  // Isolate the example’s SVG IDs and styles from the rest of the page.
  return <img className="example-image block h-full min-h-0 w-full min-w-0 object-contain" src={entry.image} alt={entry.title + ' example'}
    decoding="async" onError={() => setFailed(true)} />
}

function MarkdownView({ entry, onSelect, onShowSource }: {
  entry: Example
  onSelect: (entry: Example) => void
  onShowSource: () => void
}) {
  const html = useMemo(() => marked.parse(entry.markdown, { async: false }), [entry.markdown])

  function followLink(event: ReactMouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
      || event.shiftKey || event.altKey) return
    const link = (event.target as Element).closest('a')
    const href = link?.getAttribute('href')
    if (!href || href.startsWith('#')) return

    const url = new URL(href, `https://gum.local/${entry.collection}/text/${entry.name}.md`)
    if (url.origin !== 'https://gum.local') return
    const target = examplesByMarkdownPath.get(url.pathname)
    if (target) {
      event.preventDefault()
      onSelect(target)
      return
    }

    const source = /^\/(elements|topics)\/code\/([^/]+)\.jsx$/.exec(url.pathname)
    if (source && source[1] === entry.collection && source[2] === entry.name) {
      event.preventDefault()
      onShowSource()
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto scrollbar-none p-5">
      <article className="markdown-doc mx-auto max-w-3xl" onClick={followLink}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function ExampleWorkspace({ entry, onSelect }: {
  entry: Example
  onSelect: (entry: Example) => void
}) {
  const sourceRef = useRef<HTMLDivElement>(null)
  const [source, setSource] = useState(entry.code)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (source === entry.code) {
      setSvg('')
      setError('')
      setBusy(false)
      return
    }

    let cancelled = false
    setBusy(true)
    setError('')
    const timer = window.setTimeout(async () => {
      try {
        const { renderGum } = await import('./gum')
        const nextSvg = await renderGum(source, {
          idPrefix: `gum-docs-${entry.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
          name: `${entry.name}.jsx`,
        })
        if (cancelled) return
        setSvg(nextSvg)
      } catch (nextError) {
        if (cancelled) return
        setError(message(nextError))
      } finally {
        if (!cancelled) setBusy(false)
      }
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [entry.code, entry.id, entry.name, source])

  function focusSource() {
    sourceRef.current?.scrollIntoView({ block: 'nearest' })
    sourceRef.current?.querySelector<HTMLElement>('.cm-content')?.focus()
  }

  const status = error ? 'Error' : busy ? 'Rendering' : source === entry.code ? 'Example' : 'Live'

  return (
    <>
      <div className="docs-markdown grid min-h-0 min-w-0">
        <Pane ariaLabel="Documentation" leftTitle={`${entry.name}.md`}>
          <MarkdownView entry={entry} onSelect={onSelect} onShowSource={focusSource} />
        </Pane>
      </div>
      <div className="docs-example grid min-h-0 min-w-0 grid-rows-[minmax(0,5fr)_minmax(0,7fr)] gap-2">
        <Pane ariaLabel="Example source" leftTitle={`${entry.name}.jsx`}
          rightTitle={<button type="button" onClick={() => setSource(entry.code)} disabled={source === entry.code}
            className="cursor-pointer rounded-sm px-1 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-40">Reset</button>}>
          <div ref={sourceRef} className="min-h-0 flex-1 overflow-hidden">
            <Suspense fallback={<p className="p-4 text-sm text-gray-500" role="status">Loading source…</p>}>
              <CodeEditor value={source} onChange={setSource} wrap label={entry.title + ' example source'} />
            </Suspense>
          </div>
        </Pane>
        <Pane ariaLabel="Example preview" leftTitle={`${entry.name}.svg`} rightTitle={
          <span className="flex items-center gap-2" role="status">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${error ? 'bg-red-600' : busy ? 'animate-pulse bg-amber-600' : 'bg-green-600'}`} />
            {status}
          </span>
        }>
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
            {svg ? (
              <div className="preview-svg flex h-full w-full items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <Figure entry={entry} />
            )}
            {error && (
              <div className="absolute inset-x-4 bottom-4 max-h-[45%] overflow-auto rounded-sm border border-red-200 bg-red-50 p-3" role="alert">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-red-800">Render error</div>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-900">{error}</pre>
              </div>
            )}
          </div>
        </Pane>
      </div>
    </>
  )
}

export default function Docs() {
  const [collection, setCollection] = useState<Example['collection']>('elements')
  const [selected, setSelected] = useState<Example | undefined>(() =>
    examples.find(entry => entry.collection === 'elements' && entry.name === 'Svg') ?? examples[0])

  function selectEntry(entry: Example) {
    setSelected(entry)
    setCollection(entry.collection)
  }

  return (
    <main className="docs-page flex h-dvh flex-col bg-white p-2 ibm-plex-sans">
      <div className="docs-layout grid min-h-0 flex-1 gap-2">
        <aside className="docs-sidebar grid min-h-0 min-w-0" aria-label="Documentation browser">
          <Pane>
            <div className="shrink-0 border-b border-gray-300">
              <div className="flex" aria-label="Documentation collections">
                {sections.map(([value, title]) => (
                  <button key={value} type="button" aria-pressed={collection === value} onClick={() => setCollection(value)}
                    className={`min-w-0 flex-1 cursor-pointer first:rounded-tl-sm last:rounded-tr-sm p-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${collection === value ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                    {title}
                  </button>
                ))}
              </div>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto scrollbar-none" aria-label={collection === 'elements' ? 'Elements' : 'Topics'}>
              {categories.map(([category, title]) => {
                const entries = examples.filter(entry => entry.collection === collection && entry.category === category).sort(compareEntries)
                if (!entries.length) return null
                return (
                  <section key={category} className="border-b border-gray-200 p-2 last:border-b-0" aria-labelledby={`docs-${category}`}>
                    <h2 id={`docs-${category}`} className="mb-2 ml-1 smallcaps text-gray-600">{title}</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {entries.map(entry => (
                        <button key={entry.id} type="button" onClick={() => selectEntry(entry)} aria-current={selected?.id === entry.id ? 'page' : undefined}
                          className={`max-w-full cursor-pointer rounded-sm border px-1.5 py-1 text-left text-[14px] leading-tight break-words transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected?.id === entry.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'}`}>
                          {entry.title}
                        </button>
                      ))}
                    </div>
                  </section>
                )
              })}
            </nav>
          </Pane>
        </aside>
        {selected ? <ExampleWorkspace key={selected.id} entry={selected} onSelect={selectEntry} />
          : <p className="p-5 text-sm text-gray-500">No documentation available.</p>}
      </div>
    </main>
  )
}
