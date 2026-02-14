import { useState, useRef, useCallback, useEffect } from 'react'
import { AppState, Category } from '@/types'
import { listModels, generateStream, getErrorMessage } from '@/lib/ollama'
import { SYSTEM_PROMPTS } from '@/lib/prompts'
import { Header } from '@/components/Header'
import { CategorySelect } from '@/components/CategorySelect'
import { InputArea } from '@/components/InputArea'
import { OutputArea } from '@/components/OutputArea'
import { StatusRow } from '@/components/StatusRow'
import { GenerateButton } from '@/components/GenerateButton'

const DEFAULT_MODEL = 'gpt-oss'

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

  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitializing = useRef(false)

  const loadModels = useCallback(async () => {
    if (isInitializing.current) return
    isInitializing.current = true
    
    setState(prev => ({ ...prev, error: null }))
    
    try {
      const models = await listModels()
      setState(prev => ({
        ...prev,
        models,
        model: models.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : (models[0] || '')
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: getErrorMessage(err),
        models: [],
        model: ''
      }))
    } finally {
      isInitializing.current = false
    }
  }, [])

  useEffect(() => {
    loadModels()
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

  const canGenerate = state.inputText.trim().length > 0 && 
                      state.model && 
                      !state.isGenerating

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        models={state.models}
        model={state.model}
        setAppState={setState}
        onRefresh={loadModels}
        isLoading={false}
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
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
      </main>
    </div>
  )
}

export default App
