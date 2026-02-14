import { SetAppState } from '@/types'

interface InputAreaProps {
  value: string
  setAppState: SetAppState
  disabled: boolean
}

export function InputArea({ value, setAppState, disabled }: InputAreaProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Your rough idea</label>
      <textarea
        value={value}
        onChange={(e) => setAppState(prev => ({ ...prev, inputText: e.target.value }))}
        disabled={disabled}
        placeholder="Describe what you want in Swedish or English... e.g., 'jag vill ha en funktion som hämtar data från ett API'"
        className="w-full h-40 px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 placeholder:text-gray-400"
      />
      <p className="text-xs text-gray-500">
        Write in Swedish or English. The optimized prompt will be in the same language.
      </p>
    </div>
  )
}
