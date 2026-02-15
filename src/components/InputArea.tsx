import { useApp } from '@/contexts/AppContext'

export function InputArea() {
  const { state, setState } = useApp()

  return (
    <div className="flex flex-col gap-2">
      <label className="section-label">Your rough idea</label>
      <div className="relative">
        <textarea
          value={state.inputText}
          onChange={(e) => setState((prev) => ({ ...prev, inputText: e.target.value }))}
          disabled={state.isGenerating}
          placeholder="Describe what you want in Swedish or English... e.g., 'jag vill ha en funktion som hämtar data från ett API'"
          className="w-full h-28 px-3 py-2 text-sm font-mono text-ghost-bright bg-void border border-void-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent placeholder:text-ghost-muted placeholder:font-sans disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 overflow-y-auto shadow-sm"
        />
        {state.inputText.length > 0 && (
          <div className="absolute bottom-2.5 right-3 text-xs text-ghost-dim">
            {state.inputText.length} chars
          </div>
        )}
      </div>
      <p className="text-xs text-ghost-muted">
        Write in Swedish or English. The optimized prompt will be in the same language.
        <span className="ml-1 text-ghost-bright">⌘+Enter to generate, Esc to stop</span>
      </p>
    </div>
  )
}
