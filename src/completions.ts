import { javascriptLanguage, scopeCompletionSource } from '@codemirror/lang-javascript'
import * as math from '@gum-jsx/math'

// Match the evaluator's math scope without maintaining a second list of names.
export const mathCompletionSource = scopeCompletionSource(math)
export const mathCompletions = javascriptLanguage.data.of({ autocomplete: mathCompletionSource })
