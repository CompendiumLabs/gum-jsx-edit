import { useEffect, useRef, useState } from 'react'
import CodeEditor from './CodeEditor'
import { Pane, ToolbarButton } from './Utils'
import { renderGum } from './gum'
import type { NavigationProps } from './navigation'

const STORAGE_KEY = 'gum-edit:source'

const starter = `<Svg width={px(640)} font_size={px(18)} color={slate}>
  <Box width={1} padding={px(24)} border_width={px(2)}
    border_color={blue} radius={px(16)}>
    <VStack width={1} gap={px(18)}>
      <Text font_size={px(30)} font_weight={bold}>Make something.</Text>
      <Text line_height={em(1.45)} color={slate}>
        Edit this gum JSX and the SVG updates as you type.
      </Text>
      <HStack width={1} gap={px(14)} align="stretch">
        <RoundedRect grow={1} height={px(110)} radius={px(14)}
          fill={blue} stroke={none} />
        <Circle width={px(110)} fill={red} stroke={none} />
        <RoundedRect grow={1} height={px(110)} radius={px(14)}
          fill={green} stroke={none} />
      </HStack>
    </VStack>
  </Box>
</Svg>`

function message(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function App({ onNavigate }: NavigationProps) {
  const [source, setSource] = useState(() => localStorage.getItem(STORAGE_KEY) ?? starter)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [copied, setCopied] = useState(false)
  const renderId = useRef(0)

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

  const rightTitle = <><span className="flex items-center gap-2">
    <span className={`size-1.5 rounded-full ${error ? 'bg-red-600' : busy ? 'animate-pulse bg-amber-600' : 'bg-green-600'}`} />
      {error ? 'Error' : busy ? 'Rendering' : 'Live'}
    </span>
  </>

  return (
    <main className="flex h-dvh flex-col bg-white p-2 text-gray-800">
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-2 lg:grid-cols-2 lg:grid-rows-1">
        <Pane ariaLabel="JSX editor" leftTitle="editor.jsx" rightTitle="auto-run">
          <CodeEditor value={source} onChange={setSource} wrap={true} />
        </Pane>

        <Pane ariaLabel="SVG preview" leftTitle="preview.svg" rightTitle={rightTitle}>
          <div className="relative min-h-0 flex-1 overflow-auto p-6 sm:p-10">
            <div className="m-auto flex min-h-full w-full items-center justify-center">
              {svg ? (
                <div
                  className="preview-svg w-full max-w-3xl [&>svg]:block [&>svg]:h-auto [&>svg]:max-h-[calc(100vh-9rem)] [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : !error ? (
                <span className="text-sm text-gray-500">Loading fonts…</span>
              ) : null}
            </div>
            {error && (
              <div className="absolute inset-x-4 bottom-4 max-h-[45%] overflow-auto rounded-sm border border-red-200 bg-red-50 p-3 sm:inset-x-6" role="alert">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-red-800">Render error</div>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-900">{error}</pre>
              </div>
            )}
          </div>
        </Pane>
      </div>
    </main>
  )
}

export default App
