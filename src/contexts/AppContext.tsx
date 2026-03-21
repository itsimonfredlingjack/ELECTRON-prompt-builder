/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppContextValue } from '@/types'
import { defaultAppState } from '@/contexts/defaultState'

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
  const [state, setState] = useState(defaultAppState)
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null)

  useEffect(() => {
    void window.electronAPI.getModelCapabilities().then((modelCapabilities) => {
      setState((prev) => ({
        ...prev,
        modelCapabilities,
        models: modelCapabilities.map((model) => model.id),
        model: modelCapabilities.some((model) => model.id === prev.model)
          ? prev.model
          : modelCapabilities[0]?.id ?? prev.model,
      }))
    })
  }, [])

  const value: AppContextValue = {
    state,
    setState,
    ollamaConnected,
    setOllamaConnected,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
