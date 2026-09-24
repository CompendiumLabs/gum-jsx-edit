import { javascriptLanguage, scopeCompletionSource } from '@codemirror/lang-javascript'

type CompletionSource = ReturnType<typeof scopeCompletionSource>
let mathSource: Promise<CompletionSource> | undefined

// Load the evaluator's math scope when completion is first requested.
export const mathCompletionSource: CompletionSource = async context => {
  mathSource ??= import('@gum-jsx/math').then(scopeCompletionSource)
    .catch(error => { mathSource = undefined; throw error })
  return (await mathSource)(context)
}
export const mathCompletions = javascriptLanguage.data.of({ autocomplete: mathCompletionSource })
