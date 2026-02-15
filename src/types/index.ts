export type Category = 'coding' | 'analysis' | 'creative'

export interface AppState {
  category: Category
  model: string
  models: string[]
  inputText: string
  outputText: string
  isStreaming: boolean
  isGenerating: boolean
  error: string | null
}

export type SetAppState = React.Dispatch<React.SetStateAction<AppState>>

export interface AppContextValue {
  state: AppState
  setState: SetAppState
  apiKey: string
  setApiKey: (key: string) => void
  apiKeyConfigured: boolean
  zaiConnected: boolean | null
  setZaiConnected: (v: boolean | null) => void
}
