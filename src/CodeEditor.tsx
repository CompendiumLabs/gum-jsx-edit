import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { EditorView, scrollPastEnd } from '@codemirror/view'
import { useMemo } from 'react'
import { mathCompletions } from './completions'

const language = javascript({ jsx: true })
const typescript = javascript({ jsx: true, typescript: true })
const shellLanguage = StreamLanguage.define(shell)
const syntaxExtensions = {
  javascript: language,
  typescript,
  shell: shellLanguage,
  plain: [],
}
const overscroll = scrollPastEnd()
const theme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '14px',
  },
  '.cm-scroller': {
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    lineHeight: '1.65',
  },
  '.cm-content': {
    caretColor: '#1f2937',
    padding: '10px 0',
  },
  '.cm-line': { padding: '0 12px' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#1f2937' },
  '.cm-activeLineGutter': { backgroundColor: '#f3f4f6', color: '#374151' },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
    color: '#6b7280',
    paddingLeft: '6px',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#dbeafe !important',
  },
  '&.cm-focused': { outline: 'none' },
}, { dark: false })

type CodeEditorProps = {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  wrap?: boolean
  label?: string
  fill?: boolean
  syntax?: keyof typeof syntaxExtensions
}

export default function CodeEditor({ value, onChange, readOnly = false, wrap = false, label = 'Gum JSX source', fill = true, syntax = 'javascript' }: CodeEditorProps) {
  const extensions = useMemo(() => [
    syntaxExtensions[syntax],
    ...(!readOnly && (syntax === 'javascript' || syntax === 'typescript') ? [mathCompletions] : []),
    ...(fill ? [overscroll] : []),
    EditorView.contentAttributes.of({ 'aria-label': label }),
    ...(wrap ? [EditorView.lineWrapping] : []),
  ], [fill, label, readOnly, syntax, wrap])
  const basicSetup = useMemo(() => ({
    bracketMatching: true,
    closeBrackets: !readOnly,
    foldGutter: false,
    highlightActiveLine: !readOnly,
    highlightActiveLineGutter: !readOnly,
    highlightSelectionMatches: true,
    indentOnInput: !readOnly,
    lineNumbers: true,
  }), [readOnly])

  return (
    <CodeMirror
      className={fill
        ? 'h-full [&_.cm-editor]:h-full [&_.cm-scroller]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-scroller]:scrollbar-none'
        : '[&_.cm-scroller]:overflow-auto [&_.cm-scroller]:scrollbar-none'}
      value={value}
      height={fill ? '100%' : 'auto'}
      theme={theme}
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      basicSetup={basicSetup}
    />
  )
}
