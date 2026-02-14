import { useState, useRef, useCallback, useEffect } from 'react'
import { AppState } from '@/types'
import { listModels, generateStream, getErrorMessage, resetConnection } from '@/lib/ollama'
import { SYSTEM_PROMPTS } from '@/lib/prompts'
import { TitleBar } from '@/components/TitleBar'
import { Header } from '@/components/Header'
import { CategorySelect } from '@/components/CategorySelect'
import { InputArea } from '@/components/InputArea'
import { OutputArea } from '@/components/OutputArea'
import { StatusRow } from '@/components/StatusRow'
import { GenerateButton } from '@/components/GenerateButton'

const DEFAULT_MODEL = 'gpt-oss'
const RETRY_DELAYS = [1000, 2000, 4000, 5000]

function App() {
  const [state, setState] = useState<AppState>({
    category: 'coding',
    model: DEFAULT_MODEL,
    models: [],
    inputText: '',
    outputText: '',
    isStreaming: false,
    isGenerating: false,
    error: null
  })
  
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitializing = useRef(false)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadModels = useCallback(async (isRetry = false) => {
    if (isInitializing.current) return
    isInitializing.current = true
    
    if (!isRetry) {
      setOllamaConnected(null)
      resetConnection()
    }
    
    setState(prev => ({ ...prev, error: null }))
    
    try {
      const models = await listModels()
      setOllamaConnected(true)
      retryCountRef.current = 0
      setState(prev => ({
        ...prev,
        models,
        model: models.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : (models[0] || '')
      }))
    } catch (err) {
      setOllamaConnected(false)
      
      const delay = RETRY_DELAYS[Math.min(retryCountRef.current, RETRY_DELAYS.length - 1)]
      retryCountRef.current++
      
      retryTimeoutRef.current = setTimeout(() => {
        isInitializing.current = false
        loadModels(true)
      }, delay)
      
      setState(prev => ({
        ...prev,
        error: `${getErrorMessage(err)} (retrying in ${delay/1000}s...)`,
        models: [],
        model: ''
      }))
    } finally {
      isInitializing.current = false
    }
  }, [])

  useEffect(() => {
    loadModels()
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [loadModels])

  const handleGenerate = async () => {
    if (!state.inputText.trim() || !state.model) return

    setState(prev => ({
      ...prev,
      isGenerating: true,
      isStreaming: false,
      error: null,
      outputText: ''
    }))

    abortControllerRef.current = new AbortController()

    try {
      const systemPrompt = SYSTEM_PROMPTS[state.category]
      let fullOutput = ''

      setState(prev => ({ ...prev, isStreaming: true }))

      for await (const chunk of generateStream(
        state.model,
        systemPrompt,
        state.inputText,
        abortControllerRef.current.signal
      )) {
        fullOutput += chunk
        setState(prev => ({ ...prev, outputText: fullOutput }))
      }

      setState(prev => ({
        ...prev,
        isStreaming: false,
        isGenerating: false
      }))
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          isGenerating: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: getErrorMessage(err),
          isStreaming: false,
          isGenerating: false
        }))
      }
    }
  }

  const handleStop = () => {
    abortControllerRef.current?.abort()
    setState(prev => ({
      ...prev,
      isStreaming: false,
      isGenerating: false
    }))
  }

  const handleRefresh = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    retryCountRef.current = 0
    isInitializing.current = false
    loadModels()
  }

  const canGenerate = state.inputText.trim().length > 0 && 
                      state.model && 
                      !state.isGenerating

  return (
    <div className="h-dvh w-dvw overflow-hidden flex flex-col" style={{ border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 0 60px rgba(0,0,0,0.4), inset 0 0 80px rgba(0,240,255,0.01)' }}>
      <TitleBar ollamaConnected={ollamaConnected} />
      
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 md:p-5">
        <div className="glass w-full max-w-2xl max-h-full overflow-hidden flex flex-col p-5 md:p-6 shadow-glass-lg">
          <Header
            models={state.models}
            model={state.model}
            setAppState={setState}
            onRefresh={handleRefresh}
            isLoading={ollamaConnected === null}
          />
          
          <div className="flex-1 overflow-y-auto space-y-5 mt-5 pr-1">
            <CategorySelect
              category={state.category}
              setAppState={setState}
              disabled={state.isGenerating}
            />
            
            <InputArea
              value={state.inputText}
              setAppState={setState}
              disabled={state.isGenerating}
            />
            
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
            
            <OutputArea
              value={state.outputText}
              isStreaming={state.isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
