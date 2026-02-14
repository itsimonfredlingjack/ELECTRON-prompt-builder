export type Category = 'coding' | 'analysis' | 'creative'

export interface OllamaModel {
  name: string
  modified_at: string
  size: number
}

export interface OllamaGenerateRequest {
  model: string
  prompt: string
  system?: string
  stream: boolean
}

export interface OllamaGenerateResponse {
  model: string
  created_at: string
  response: string
  done: boolean
}

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
