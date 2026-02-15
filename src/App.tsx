import { useState, useCallback, useEffect, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { generateStream, getErrorMessage, checkConnection } from '@/lib/zai'
import { SYSTEM_PROMPTS } from '@/lib/prompts'
import { TitleBar } from '@/components/TitleBar'
import { Header } from '@/components/Header'
import { CategorySelect } from '@/components/CategorySelect'
import { InputArea } from '@/components/InputArea'
import { OutputArea } from '@/components/OutputArea'
import { StatusRow } from '@/components/StatusRow'
import { GenerateButton } from '@/components/GenerateButton'
import { ApiKeySettings } from '@/components/ApiKeySettings'

const UPDATE_INTERVAL_MS = 50

function App() {
  const {
    state,
    setState,
    apiKey,
    setZaiConnected,
    zaiConnected,
  } = useApp()

  const abortControllerRef = useRef<AbortController | null>(null)
  const pendingOutputRef = useRef('')
  const lastUpdateRef = useRef(0)

  const checkApiKey = useCallback(async () => {
    if (!apiKey?.trim()) {
      setZaiConnected(false)
      return
    }
    setZaiConnected(null)
    try {
      const ok = await checkConnection(apiKey)
      setZaiConnected(ok)
    } catch {
      setZaiConnected(false)
    }
  }, [apiKey, setZaiConnected])

  useEffect(() => {
    checkApiKey()
  }, [checkApiKey])

  const handleGenerate = useCallback(async () => {
    if (!state.inputText.trim() || !state.model) return

    if (!apiKey?.trim()) {
      setState((prev) => ({
        ...prev,
        error: 'Configure your Z.AI API key in Settings (gear icon) to generate prompts.',
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      isGenerating: true,
      isStreaming: false,
      error: null,
      outputText: '',
    }))

    abortControllerRef.current = new AbortController()
    pendingOutputRef.current = ''
    lastUpdateRef.current = 0

    try {
      const systemPrompt = SYSTEM_PROMPTS[state.category]
      setState((prev) => ({ ...prev, isStreaming: true }))

      for await (const chunk of generateStream(
        apiKey,
        state.model,
        systemPrompt,
        state.inputText,
        abortControllerRef.current.signal
      )) {
        pendingOutputRef.current += chunk
        const now = Date.now()
        if (now - lastUpdateRef.current >= UPDATE_INTERVAL_MS) {
          lastUpdateRef.current = now
          setState((prev) => ({ ...prev, outputText: pendingOutputRef.current }))
        }
      }
      setState((prev) => ({
        ...prev,
        outputText: pendingOutputRef.current,
        isStreaming: false,
        isGenerating: false,
      }))
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setState((prev) => ({
          ...prev,
          outputText: pendingOutputRef.current,
          isStreaming: false,
          isGenerating: false,
        }))
      } else {
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(err),
          isStreaming: false,
          isGenerating: false,
        }))
      }
    }
  }, [state.inputText, state.model, state.category, apiKey, setState])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setState((prev) => ({
      ...prev,
      outputText: pendingOutputRef.current,
      isStreaming: false,
      isGenerating: false,
    }))
  }, [setState])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleStop()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleGenerate, handleStop])

  const canGenerate =
    state.inputText.trim().length > 0 &&
    state.model &&
    !state.isGenerating

  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="h-dvh w-dvw overflow-hidden flex flex-col bg-void">
      <TitleBar />
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto px-4 py-5 md:px-6 md:py-6 flex flex-col min-h-0 animate-fade-in">
          {showSettings ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-ghost tracking-tight">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-ghost-muted hover:text-ghost rounded-lg surface"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ApiKeySettings />
            </div>
          ) : (
            <>
              <Header onOpenSettings={() => setShowSettings(true)} onRefresh={checkApiKey} />
              <div className="flex flex-col space-y-4 mt-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <CategorySelect />
                <InputArea />
                <GenerateButton
                  onClick={handleGenerate}
                  onStop={handleStop}
                  isStreaming={state.isStreaming}
                  disabled={!canGenerate}
                />
                <StatusRow
                  isStreaming={state.isStreaming}
                  isGenerating={state.isGenerating && !state.isStreaming}
                  error={state.error}
                />
                <OutputArea value={state.outputText} isStreaming={state.isStreaming} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
