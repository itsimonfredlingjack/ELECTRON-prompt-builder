import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AppState, AppContextValue } from '@/types'
import { GLM_MODELS, DEFAULT_MODEL } from '@/lib/zai'

const defaultState: AppState = {
  category: 'coding',
  model: DEFAULT_MODEL,
  models: [...GLM_MODELS],
  inputText: '',
  outputText: '',
  isStreaming: false,
  isGenerating: false,
  error: null,
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>(defaultState)
  const [apiKey, setApiKeyState] = useState<string>('')
  const [zaiConnected, setZaiConnected] = useState<boolean | null>(null)

  useEffect(() => {
    window.electronAPI?.getApiKey().then(setApiKeyState)
  }, [])

  const setApiKey = useCallback(async (key: string) => {
    await window.electronAPI?.setApiKey(key)
    setApiKeyState(key)
  }, [])

  const value: AppContextValue = {
    state,
    setState,
    apiKey,
    setApiKey,
    apiKeyConfigured: !!apiKey?.trim(),
    zaiConnected,
    setZaiConnected,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
