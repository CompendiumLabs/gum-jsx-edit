import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react'
import examples from 'virtual:gum-docs'
import type { Example } from './docs-types'
import type { NavigationProps } from './navigation'
import { Pane, ToolbarButton } from './Utils'

const categories = [
  ['showcase', 'Showcases'],
  ['core', 'Getting started'],
  ['layout', 'Layout'],
  ['geometry', 'Geometry'],
  ['text', 'Text'],
  ['api', 'API'],
] as const
const categoryNames = new Map<string, string>(categories)
const CodeEditor = lazy(() => import('./CodeEditor'))

function message(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function Figure({ entry, detailed = false }: { entry: Example, detailed?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!entry.image || failed) {
    return (
      <p className="max-w-full whitespace-pre-wrap break-words p-4 text-sm text-red-800">
        {detailed ? entry.error ?? 'Unable to display this SVG.' : 'Preview unavailable'}
      </p>
    )
  }
  // Each image isolates SVG IDs and styles from the other cards and the popup.
  return <img className="example-image block h-full min-h-0 w-full min-w-0 object-contain" src={entry.image} alt={detailed ? entry.title + ' example' : ''}
    loading={detailed ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
}

function ExampleDialog({ entry, onClose }: { entry: Example, onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const backdropStart = useRef(false)
  const titleId = useId()
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

  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [])

  return (
    <dialog ref={ref} className="example-dialog m-auto hidden h-[min(60rem,calc(100dvh-2rem))] w-[min(80rem,calc(100vw-2rem))] max-h-none max-w-none flex-col overflow-hidden rounded-sm border border-gray-300 bg-white p-0 text-gray-800 open:flex backdrop:bg-gray-900/25" aria-labelledby={titleId} onCancel={onClose}
      onPointerDown={event => { backdropStart.current = event.target === event.currentTarget }}
      onClick={event => {
        // Selecting code and releasing outside the popup should not dismiss it.
        if (backdropStart.current && event.target === event.currentTarget) onClose()
        backdropStart.current = false
      }}>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-300 px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-medium">{entry.title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">{categoryNames.get(entry.category) ?? entry.category}</p>
          </div>
          <ToolbarButton onClick={onClose} autoFocus>Close</ToolbarButton>
        </header>
        <div className="grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
          <section className="flex min-h-0 min-w-0 flex-col border-b border-gray-300 md:border-r md:border-b-0" aria-label="Example source">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-4 font-mono text-[11px] tracking-[0.02em] text-gray-600">
              <span className="truncate">{entry.name}.jsx</span>
              <span className="ml-3 shrink-0 text-gray-500">editable · wraps</span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <Suspense fallback={<p className="p-4 text-sm text-gray-500" role="status">Loading source…</p>}>
                <CodeEditor value={source} onChange={setSource} wrap label={entry.title + ' example source'} />
              </Suspense>
            </div>
          </section>
          <section className="flex min-h-0 min-w-0 flex-col" aria-label="Example figure">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-4 font-mono text-[11px] tracking-[0.02em] text-gray-600">
              <span>figure.svg</span>
              <span className="flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${error ? 'bg-red-600' : busy ? 'animate-pulse bg-amber-600' : 'bg-green-600'}`} />
                {error ? 'Error' : busy ? 'Rendering' : source === entry.code ? 'Example' : 'Live'}
              </span>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
              {svg ? (
                <div className="preview-svg flex h-full w-full items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: svg }} />
              ) : (
                <Figure entry={entry} detailed />
              )}
              {error && (
                <div className="absolute inset-x-4 bottom-4 max-h-[45%] overflow-auto rounded-sm border border-red-200 bg-red-50 p-3 sm:inset-x-6" role="alert">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-red-800">Render error</div>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-900">{error}</pre>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </dialog>
  )
}

function SearchBar({ search, setSearch, category, setCategory }: { search: string, setSearch: (search: string) => void, category: string, setCategory: (category: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
      <label className="sr-only" htmlFor="example-search">Search examples</label>
      <input className="docs-field w-full min-w-0 rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" id="example-search" type="search" autoComplete="off"
        placeholder="Search examples…" value={search} onChange={event => setSearch(event.target.value)} />
      <label className="sr-only" htmlFor="example-category">Category</label>
      <select className="docs-field w-full min-w-0 rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" id="example-category" value={category} onChange={event => setCategory(event.target.value)}>
        <option value="all">All categories</option>
        {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>
    </div>
  )
}

export default function Docs({ onNavigate }: NavigationProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<Example | null>(null)
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return examples.filter(entry => (category === 'all' || entry.category === category)
      && `${entry.name} ${entry.title} ${categoryNames.get(entry.category) ?? entry.category}`.toLowerCase().includes(query))
  }, [search, category])

  return (
    <main className={`h-dvh bg-white p-2 text-gray-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${selected ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 px-4">
        <h1 className="font-mono text-sm">gum / edit</h1>
        <SearchBar search={search} setSearch={setSearch} category={category} setCategory={setCategory} />
        <ToolbarButton href={import.meta.env.BASE_URL} onClick={event => onNavigate(event, 'editor')}>Editor</ToolbarButton>
      </header>

      {filtered.length ? (
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(entry => (
            <button className="example-card flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-sm border border-gray-300 bg-white text-left transition-colors duration-[120ms] hover:border-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" key={entry.id} type="button" onClick={() => setSelected(entry)}
              aria-label={`Open ${entry.title} example`} aria-haspopup="dialog">
              <div className="flex min-h-11 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2">
                <h2 className="min-w-0 text-sm font-medium">{entry.title}</h2>
                <span className="shrink-0 text-[10px] text-gray-500">{categoryNames.get(entry.category) ?? entry.category}</span>
              </div>
              <div className="flex aspect-[4/3] min-h-0 items-center justify-center p-4">
                <Figure entry={entry} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-6 border border-gray-200 p-8 text-center text-sm text-gray-600">
          No matching examples. Try another search or category.
        </p>
      )}

      {selected && <ExampleDialog entry={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}
