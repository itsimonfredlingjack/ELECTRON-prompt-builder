import { SetAppState } from '@/types'

interface HeaderProps {
  models: string[]
  model: string
  setAppState: SetAppState
  onRefresh: () => void
  isLoading: boolean
}

export function Header({ models, model, setAppState, onRefresh, isLoading }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">AI Prompt Builder</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={model}
          onChange={(e) => setAppState(prev => ({ ...prev, model: e.target.value }))}
          className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {models.length === 0 && (
            <option value="">No models found</option>
          )}
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh models"
        >
          <svg 
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>
  )
}
