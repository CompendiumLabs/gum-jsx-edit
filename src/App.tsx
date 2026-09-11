import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { EditorView } from '@codemirror/view'
import { useEffect, useMemo, useRef, useState } from 'react'
import { renderGum } from './gum'

const STORAGE_KEY = 'gum-edit:source'

const starter = `<Svg width={px(640)} font_size={px(18)} color="#203746">
  <Box width={1} padding={px(24)} border_width={px(2)}
    border_color="#317969" background="#ffffff" radius={px(16)}>
    <VStack width={1} gap={px(18)}>
      <Text font_size={px(30)} font_weight={700}>Make something.</Text>
      <Text line_height={em(1.45)} color="#58717e">
        Edit this gum JSX and the SVG updates as you type.
      </Text>
      <HStack width={1} gap={px(14)} align="stretch">
        <RoundedRect grow={1} height={px(110)} radius={px(14)}
          fill="#bce1d4" stroke="none" />
        <Circle width={px(110)} fill="#ee8f67" stroke="none" />
        <RoundedRect grow={1} height={px(110)} radius={px(14)}
          fill="#d9d0f0" stroke="none" />
      </HStack>
    </VStack>
  </Box>
</Svg>`

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#111513',
    color: '#d9e1dd',
    fontSize: '14px',
  },
  '.cm-content': {
    caretColor: '#7fd1aa',
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    lineHeight: '1.65',
    padding: '20px 0 48px',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#7fd1aa' },
  '.cm-activeLine': { backgroundColor: '#18201c' },
  '.cm-activeLineGutter': { backgroundColor: '#18201c', color: '#87958e' },
  '.cm-gutters': {
    backgroundColor: '#111513',
    border: 'none',
    color: '#4f5c56',
    paddingLeft: '6px',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#294c3c !important',
  },
  '&.cm-focused': { outline: 'none' },
}, { dark: true })

function message(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function App() {
  const [source, setSource] = useState(() => localStorage.getItem(STORAGE_KEY) ?? starter)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [copied, setCopied] = useState(false)
  const renderId = useRef(0)
  const extensions = useMemo(() => [javascript({ jsx: true })], [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, source)
    const id = ++renderId.current
    setBusy(true)

    const timer = window.setTimeout(async () => {
      try {
        const nextSvg = await renderGum(source)
        if (id !== renderId.current) return
        setSvg(nextSvg)
        setError('')
      } catch (nextError) {
        if (id !== renderId.current) return
        setError(message(nextError))
      } finally {
        if (id === renderId.current) setBusy(false)
      }
    }, 180)

    return () => window.clearTimeout(timer)
  }, [source])

  async function copySvg() {
    if (!svg) return
    await navigator.clipboard.writeText(svg)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  function downloadSvg() {
    if (!svg) return
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'gum.svg'
    link.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    setSource(starter)
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#111513] text-[#d9e1dd]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-md bg-[#75c9a1] font-mono text-sm font-bold text-[#102018]">
            g
          </span>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold tracking-wide text-white">gum edit</h1>
            <span className="hidden text-xs text-[#718078] sm:inline">JSX to SVG</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="toolbar-button" type="button" onClick={reset}>Reset</button>
          <button className="toolbar-button" type="button" onClick={copySvg} disabled={!svg}>
            {copied ? 'Copied' : 'Copy SVG'}
          </button>
          <button className="toolbar-button toolbar-button-primary" type="button" onClick={downloadSvg} disabled={!svg}>
            Download
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
        <section className="flex min-h-0 flex-col border-b border-white/10 lg:border-r lg:border-b-0">
          <div className="pane-heading">
            <span>editor.jsx</span>
            <span className="text-[#637169]">auto-run</span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <CodeMirror
              value={source}
              height="100%"
              theme={editorTheme}
              extensions={extensions}
              onChange={setSource}
              basicSetup={{
                bracketMatching: true,
                closeBrackets: true,
                foldGutter: false,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                indentOnInput: true,
                lineNumbers: true,
              }}
            />
          </div>
        </section>

        <section className="flex min-h-0 flex-col bg-[#e9ece8] text-[#26312c]">
          <div className="pane-heading border-black/10 bg-[#f4f5f2] text-[#52605a]">
            <span>preview.svg</span>
            <span className="flex items-center gap-2">
              <span className={`size-1.5 rounded-full ${error ? 'bg-[#c55e4d]' : busy ? 'animate-pulse bg-[#d19b3a]' : 'bg-[#44956e]'}`} />
              {error ? 'Error' : busy ? 'Rendering' : 'Live'}
            </span>
          </div>
          <div className="preview-grid relative min-h-0 flex-1 overflow-auto p-6 sm:p-10">
            <div className="m-auto flex min-h-full w-full items-center justify-center">
              {svg ? (
                <div
                  className="preview-svg w-full max-w-3xl"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : !error ? (
                <span className="text-sm text-[#738079]">Loading fonts…</span>
              ) : null}
            </div>
            {error && (
              <div className="absolute inset-x-4 bottom-4 max-h-[45%] overflow-auto rounded-lg border border-[#d9a397] bg-[#fff8f5]/95 p-3 shadow-lg backdrop-blur sm:inset-x-6">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a54838]">Render error</div>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#6d3026]">{error}</pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
