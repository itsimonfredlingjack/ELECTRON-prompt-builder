import { SetAppState } from '@/types'

interface InputAreaProps {
  value: string
  setAppState: SetAppState
  disabled: boolean
}

export function InputArea({ value, setAppState, disabled }: InputAreaProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ghost-muted tracking-wide">Your rough idea</label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setAppState(prev => ({ ...prev, inputText: e.target.value }))}
          disabled={disabled}
          placeholder="Describe what you want in Swedish or English... e.g., 'jag vill ha en funktion som hämtar data från ett API'"
          className="w-full h-32 px-4 py-3 text-sm text-ghost bg-glass-light border border-glass-border rounded-xl resize-none focus:outline-none focus:border-neon-cyan/50 focus:shadow-glow-cyan-sm placeholder:text-ghost-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-y-auto"
        />
        {value.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-ghost-dim">
            {value.length} chars
          </div>
        )}
      </div>
      <p className="text-xs text-ghost-dim">
        Write in Swedish or English. The optimized prompt will be in the same language.
      </p>
    </div>
  )
}
