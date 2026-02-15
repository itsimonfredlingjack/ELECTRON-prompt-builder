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
          className="w-full h-28 px-4 py-3 text-xs font-mono text-ghost-bright bg-white/45 border border-void-border rounded-lg resize-none focus:outline-none focus:border-accent focus:shadow-glow placeholder:text-ghost-dim placeholder:font-sans disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-void-border-bright shadow-clay-sm overflow-y-auto"
        />
        {state.inputText.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-ghost-dim">
            {state.inputText.length} chars
          </div>
        )}
      </div>
      <p className="text-xs text-ghost-muted">
        Write in Swedish or English. The optimized prompt will be in the same language.
        <span className="ml-1 text-ghost">⌘+Enter to generate, Esc to stop</span>
      </p>
    </div>
  )
}
