import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { SYSTEM_PROMPTS } from '@/lib/prompts'
import { getErrorMessage, supportsImages, toAppError } from '@/lib/zai'
import { createGenerationRequest } from '@/lib/generation'
import type { AiGenerationEvent, ImageAttachment } from '@/types'
import { TitleBar } from '@/components/TitleBar'
import { Header } from '@/components/Header'
import { CategorySelect } from '@/components/CategorySelect'
import { InputArea } from '@/components/InputArea'
import { OutputArea } from '@/components/OutputArea'
import { StatusRow } from '@/components/StatusRow'
import { GenerateButton } from '@/components/GenerateButton'

function App() {
  const { state, setState, setOllamaConnected } = useApp()
  const requestIdRef = useRef<string | null>(null)
  const pendingOutputRef = useRef('')
  const imageAttachmentRef = useRef<ImageAttachment | null>(state.imageAttachment)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)
  const selectedModel = useMemo(
    () => state.modelCapabilities.find((model) => model.id === state.model),
    [state.modelCapabilities, state.model],
  )

  useEffect(() => {
    imageAttachmentRef.current = state.imageAttachment
  }, [state.imageAttachment])

  const clearPreparedAttachment = useCallback((attachment: ImageAttachment | null) => {
    if (attachment?.tempId) {
      void window.electronAPI.clearPreparedImage(attachment.tempId)
    }
  }, [])

  const checkModelConnection = useCallback(async () => {
    if (!state.model) {
      setOllamaConnected(false)
      return
    }

    setOllamaConnected(null)
    try {
      const ok = await window.electronAPI.checkConnection({
        model: state.model,
      })
      setOllamaConnected(ok)
    } catch {
      setOllamaConnected(false)
    }
  }, [setOllamaConnected, state.model])

  useEffect(() => {
    void checkModelConnection()
  }, [checkModelConnection])

  useEffect(() => {
    return window.electronAPI.onGenerationEvent((event: AiGenerationEvent) => {
      if (event.requestId !== requestIdRef.current) return

      if (event.type === 'progress') {
        setState((prev) => ({
          ...prev,
          uploadStatus: event.stage,
          uploadProgress: event.progress,
          isGenerating: true,
          isStreaming: event.stage === 'analyzing',
        }))
        return
      }

      if (event.type === 'chunk') {
        pendingOutputRef.current += event.chunk
        setState((prev) => ({
          ...prev,
          outputText: pendingOutputRef.current,
          isGenerating: true,
          isStreaming: true,
          uploadStatus: 'analyzing',
          uploadProgress: Math.max(prev.uploadProgress, 85),
        }))
        return
      }

      if (event.type === 'complete') {
        requestIdRef.current = null
        clearPreparedAttachment(imageAttachmentRef.current)
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          isStreaming: false,
          imageAttachment: null,
          uploadStatus: 'idle',
          uploadProgress: 0,
          uploadError: null,
        }))
        return
      }

      requestIdRef.current = null
      clearPreparedAttachment(imageAttachmentRef.current)
      setState((prev) => ({
        ...prev,
        error: event.error.message,
        isGenerating: false,
        isStreaming: false,
        imageAttachment: null,
        uploadStatus: 'idle',
        uploadProgress: 0,
        uploadError: null,
      }))
    })
  }, [clearPreparedAttachment, setState])

  const handleGenerate = useCallback(async () => {
    if (!state.inputText.trim() || !state.model) return

    if (!selectedModel) {
      setState((prev) => ({
        ...prev,
        error: 'The selected model is not available.',
      }))
      return
    }

    if (state.imageAttachment && !state.imageAttachment.prepared) {
      setState((prev) => ({
        ...prev,
        uploadError: toAppError('INVALID_UPLOAD', 'Select a valid image before starting analysis.'),
      }))
      return
    }

    if (state.imageAttachment && !supportsImages(state.model)) {
      setState((prev) => ({
        ...prev,
        uploadError: toAppError(
          'MODEL_NOT_SUPPORTED',
          `${selectedModel.label} does not support image analysis.`,
        ),
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      isGenerating: true,
      isStreaming: false,
      error: null,
      outputText: '',
      uploadError: null,
      uploadStatus: state.imageAttachment ? 'analyzing' : 'idle',
      uploadProgress: state.imageAttachment ? 35 : 0,
    }))
    pendingOutputRef.current = ''

    try {
      const { requestId } = await window.electronAPI.startGeneration(
        createGenerationRequest({
          model: state.model,
          systemPrompt: SYSTEM_PROMPTS[state.category],
          userInput: state.inputText,
          imageAttachment: state.imageAttachment,
        }),
      )
      requestIdRef.current = requestId
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(error),
        isGenerating: false,
        isStreaming: false,
        uploadStatus: 'error',
      }))
    }
  }, [selectedModel, setState, state.category, state.imageAttachment, state.inputText, state.model])

  const handleStop = useCallback(() => {
    if (requestIdRef.current) {
      const requestId = requestIdRef.current
      requestIdRef.current = null
      clearPreparedAttachment(imageAttachmentRef.current)
      void window.electronAPI.cancelGeneration(requestId)
    }

    setState((prev) => ({
      ...prev,
      outputText: pendingOutputRef.current || prev.outputText,
      error: null,
      isStreaming: false,
      isGenerating: false,
      imageAttachment: null,
      uploadStatus: 'idle',
      uploadProgress: 0,
      uploadError: null,
    }))
  }, [clearPreparedAttachment, setState])

  const handleClearOutput = useCallback(() => {
    pendingOutputRef.current = ''
    setState((prev) => ({
      ...prev,
      outputText: '',
    }))
  }, [setState])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleStop()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void handleGenerate()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleGenerate, handleStop])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateHeaderDensity = () => {
      setIsHeaderCompact(container.scrollTop > 14)
    }

    updateHeaderDensity()
    container.addEventListener('scroll', updateHeaderDensity, { passive: true })

    return () => {
      container.removeEventListener('scroll', updateHeaderDensity)
    }
  }, [])

  const canGenerate =
    state.inputText.trim().length > 0 &&
    !!state.model &&
    !state.isGenerating &&
    (!state.imageAttachment || (state.imageAttachment.prepared && !state.uploadError && supportsImages(state.model)))

  return (
    <div className="h-dvh w-dvw overflow-hidden flex flex-col bg-void">
      <TitleBar />
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto px-4 py-5 md:px-6 md:py-6 flex flex-col min-h-0 animate-fade-in">
          <Header onRefresh={() => void checkModelConnection()} compact={isHeaderCompact} />
          <div className="mt-4 grid items-start gap-4 lg:gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="rounded-xl border border-void-border bg-void-light/60 p-4 md:p-5 shadow-sm">
              <div className="flex flex-col space-y-4">
                <CategorySelect />
                <InputArea />
                <GenerateButton
                  onClick={() => void handleGenerate()}
                  onRegenerate={() => void handleGenerate()}
                  onStop={handleStop}
                  isStreaming={state.isStreaming || state.isGenerating}
                  disabled={!canGenerate}
                  showRegenerate={!!state.outputText.trim()}
                />
                <StatusRow
                  isStreaming={state.isStreaming}
                  isGenerating={state.isGenerating && !state.isStreaming}
                  error={state.error}
                  uploadStatus={state.uploadStatus}
                  uploadProgress={state.uploadProgress}
                  activeModelLabel={selectedModel?.label ?? 'selected model'}
                />
              </div>
            </section>

            <section className="rounded-xl border border-void-border bg-void-light/60 p-4 md:p-5 shadow-sm lg:sticky lg:top-4 lg:self-start">
              <OutputArea value={state.outputText} isStreaming={state.isStreaming} onClear={handleClearOutput} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
