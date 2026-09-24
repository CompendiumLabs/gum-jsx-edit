import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { EditorView, scrollPastEnd } from '@codemirror/view'
import { mathCompletions } from './completions'

const extensions = [
  javascript({ jsx: true }),
  mathCompletions,
  scrollPastEnd(),
  EditorView.contentAttributes.of({ 'aria-label': 'Gum JSX source' }),
  EditorView.lineWrapping,
]
const basicSetup = {
  bracketMatching: true,
  closeBrackets: true,
  foldGutter: false,
  highlightActiveLine: true,
  highlightActiveLineGutter: true,
  highlightSelectionMatches: true,
  indentOnInput: true,
  lineNumbers: true,
}
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
  onChange: (value: string) => void
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <CodeMirror
      className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-scroller]:scrollbar-none"
      value={value}
      height="100%"
      theme={theme}
      extensions={extensions}
      onChange={onChange}
      basicSetup={basicSetup}
    />
  )
}
