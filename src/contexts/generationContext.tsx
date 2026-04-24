/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useComposerActions, useComposerState } from '@/contexts/composerContext'
import { useOutputActions } from '@/contexts/outputContext'
import { useRuntimeActions, useRuntimeState } from '@/contexts/runtimeContext'
import { createGenerationRequest } from '@/lib/generation'
import { buildPromptBuilderInput, mapTargetToCategory } from '@/lib/promptWorkbench'
import {
  applyCancelRequest,
  applyGenerationEvent,
  createGenerationSession,
  getKeyboardGenerationAction,
  isGenerationInFlight,
  type GenerationSession,
} from '@/lib/generationLifecycle'
import { getErrorMessage, toAppError } from '@/lib/ollama'
import { SYSTEM_PROMPTS } from '@/lib/prompts'
import type {
  GenerationLifecycleState,
  PromptIntent,
  PromptStrategy,
  PromptTarget,
  PromptVersionKind,
  StartGenerationRequest,
} from '@/types'

interface GenerationStateValue {
  requestId: string | null
  generationState: GenerationLifecycleState
  error: string | null
  notice: string | null
  isGenerating: boolean
  isStreaming: boolean
  isBusy: boolean
}

interface GenerationControlsValue {
  canGenerate: boolean
  startGeneration: (options?: StartGenerationOptions) => Promise<void>
  cancelGeneration: () => void
}

interface StartGenerationOptions {
  mode?: PromptVersionKind
  label?: string | null
  sourcePrompt?: string | null
  extraInstruction?: string | null
  targetOverride?: PromptTarget
  intentOverride?: PromptIntent
  strategyOverride?: PromptStrategy
  parentVersionId?: string | null
}

const GenerationStateContext = createContext<GenerationStateValue | null>(null)
const GenerationControlsContext = createContext<GenerationControlsValue | null>(null)

export function useGenerationState() {
  const ctx = useContext(GenerationStateContext)
  if (!ctx) throw new Error('useGenerationState must be used within GenerationProvider')
  return ctx
}

export function useGenerationControls() {
  const ctx = useContext(GenerationControlsContext)
  if (!ctx) throw new Error('useGenerationControls must be used within GenerationProvider')
  return ctx
}

interface GenerationProviderProps {
  children: ReactNode
}

export function GenerationProvider({ children }: GenerationProviderProps) {
  const runtimeState = useRuntimeState()
  const runtimeActions = useRuntimeActions()
  const composerState = useComposerState()
  const composerActions = useComposerActions()
  const outputActions = useOutputActions()
  const [requestId, setRequestId] = useState<string | null>(null)
  const [generationState, setGenerationState] = useState<GenerationLifecycleState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const generationSessionRef = useRef<GenerationSession>({ requestId: null, state: 'idle' })
  const runtimeRef = useRef({
    selectedModelId: runtimeState.selectedModelId,
    selectedModelInstalled: runtimeState.selectedModelInstalled,
    selectedModelReady: runtimeState.selectedModelReady,
    selectedModelVisionSupport: runtimeState.selectedModelVisionSupport,
  })
  const composerRef = useRef({
    category: composerState.category,
    promptIntent: composerState.promptIntent,
    promptTarget: composerState.promptTarget,
    promptStrategy: composerState.promptStrategy,
    inputText: composerState.inputText,
    contextText: composerState.contextText,
    mustInclude: composerState.mustInclude,
    mustAvoid: composerState.mustAvoid,
    outputShape: composerState.outputShape,
    referenceMaterial: composerState.referenceMaterial,
    extraConstraints: composerState.extraConstraints,
    imageAttachment: composerState.imageAttachment,
  })
  const hasStreamedChunkRef = useRef(false)

  useEffect(() => {
    runtimeRef.current = {
      selectedModelId: runtimeState.selectedModelId,
      selectedModelInstalled: runtimeState.selectedModelInstalled,
      selectedModelReady: runtimeState.selectedModelReady,
      selectedModelVisionSupport: runtimeState.selectedModelVisionSupport,
    }
  }, [
    runtimeState.selectedModelId,
    runtimeState.selectedModelInstalled,
    runtimeState.selectedModelReady,
    runtimeState.selectedModelVisionSupport,
  ])

  useEffect(() => {
    composerRef.current = {
      category: composerState.category,
      promptIntent: composerState.promptIntent,
      promptTarget: composerState.promptTarget,
      promptStrategy: composerState.promptStrategy,
      inputText: composerState.inputText,
      contextText: composerState.contextText,
      mustInclude: composerState.mustInclude,
      mustAvoid: composerState.mustAvoid,
      outputShape: composerState.outputShape,
      referenceMaterial: composerState.referenceMaterial,
      extraConstraints: composerState.extraConstraints,
      imageAttachment: composerState.imageAttachment,
    }
  }, [
    composerState.category,
    composerState.contextText,
    composerState.extraConstraints,
    composerState.imageAttachment,
    composerState.inputText,
    composerState.mustAvoid,
    composerState.mustInclude,
    composerState.outputShape,
    composerState.promptIntent,
    composerState.promptStrategy,
    composerState.promptTarget,
    composerState.referenceMaterial,
  ])

  const startGeneration = useCallback(async (options: StartGenerationOptions = {}) => {
    const {
      selectedModelId,
      selectedModelInstalled,
      selectedModelReady,
      selectedModelVisionSupport,
    } = runtimeRef.current
    const {
      inputText,
      contextText,
      mustInclude,
      mustAvoid,
      outputShape,
      referenceMaterial,
      extraConstraints,
      promptIntent,
      promptTarget,
      promptStrategy,
      imageAttachment,
    } = composerRef.current
    const hasUsableSource = inputText.trim() || options.sourcePrompt?.trim()

    if (!hasUsableSource || !selectedModelId) return

    if (!selectedModelInstalled) {
      setError(`The selected model "${selectedModelId}" is not installed in Ollama.`)
      return
    }

    if (!selectedModelReady) {
      setError(`The selected model "${selectedModelId}" is not ready yet. Refresh Ollama runtime status and try again.`)
      return
    }

    if (imageAttachment && !imageAttachment.prepared) {
      composerActions.reportUploadError(toAppError('INVALID_UPLOAD', 'Select a valid image before starting analysis.'))
      return
    }

    if (imageAttachment && selectedModelVisionSupport === 'unsupported') {
      composerActions.reportUploadError(
        toAppError('MODEL_NOT_SUPPORTED', `The selected model "${selectedModelId}" does not report image support.`),
      )
      return
    }

    if (imageAttachment && selectedModelVisionSupport === 'unknown') {
      composerActions.reportUploadError(
        toAppError(
          'MODEL_NOT_SUPPORTED',
          `Image support could not be confirmed for "${selectedModelId}". Remove the image or switch to a model that explicitly reports vision support.`,
        ),
      )
      return
    }

    const resolvedIntent = options.intentOverride ?? promptIntent
    const resolvedTarget = options.targetOverride ?? promptTarget
    const resolvedStrategy = options.strategyOverride ?? promptStrategy
    const resolvedCategory = mapTargetToCategory(resolvedTarget)
    const userInput = buildPromptBuilderInput({
      rawIntent: inputText,
      contextText,
      mustInclude,
      mustAvoid,
      outputShape,
      referenceMaterial,
      extraConstraints,
      promptIntent: resolvedIntent,
      promptTarget: resolvedTarget,
      promptStrategy: resolvedStrategy,
      hasImageAttachment: !!imageAttachment,
    }, {
      mode: options.mode,
      label: options.label,
      sourcePrompt: options.sourcePrompt,
      extraInstruction: options.extraInstruction,
    })

    const nextRequestId = window.crypto.randomUUID()
    const generationSession = createGenerationSession(nextRequestId)
    const generationRequest: StartGenerationRequest = {
      requestId: nextRequestId,
      ...createGenerationRequest({
        model: selectedModelId,
        systemPrompt: SYSTEM_PROMPTS[resolvedCategory],
        userInput,
        imageAttachment,
      }),
    }

    generationSessionRef.current = generationSession
    hasStreamedChunkRef.current = false
    setRequestId(generationSession.requestId)
    setGenerationState(generationSession.state)
    setError(null)
    setNotice(null)
    runtimeActions.clearNotice()
    outputActions.beginOutputSession({
      sourceValue: inputText,
      briefText: userInput,
      contextText,
      mustInclude,
      mustAvoid,
      outputShape,
      referenceMaterial,
      extraConstraints,
      hasImageAttachment: !!imageAttachment,
      category: resolvedCategory,
      promptIntent: resolvedIntent,
      promptTarget: resolvedTarget,
      promptStrategy: resolvedStrategy,
      requestMode: options.mode ?? 'initial',
      requestLabel: options.label ?? null,
      parentVersionId: options.parentVersionId ?? null,
    })
    if (imageAttachment) {
      composerActions.markAttachmentAnalyzing(35)
      composerActions.reportUploadError(null)
    }

    try {
      const startResponse = await window.electronAPI.startGeneration(generationRequest)
      if (startResponse.requestId !== nextRequestId) {
        throw new Error('Generation request identity mismatch.')
      }
    } catch (nextError) {
      generationSessionRef.current = {
        requestId: null,
        state: 'failed',
      }
      setRequestId(null)
      setGenerationState('failed')
      setError(getErrorMessage(nextError))
      setNotice(null)
      composerActions.markAttachmentFailure()
    }
  }, [composerActions, outputActions, runtimeActions])

  const cancelGeneration = useCallback(() => {
    const cancelUpdate = applyCancelRequest(generationSessionRef.current)

    if (!cancelUpdate.accepted || !cancelUpdate.nextSession.requestId) {
      return
    }

    generationSessionRef.current = cancelUpdate.nextSession
    const nextRequestId = cancelUpdate.nextSession.requestId

    setRequestId(nextRequestId)
    setGenerationState(cancelUpdate.nextSession.state)
    setError(null)
    setNotice('Cancelling generation...')

    void window.electronAPI.cancelGeneration(nextRequestId).catch((nextError) => {
      generationSessionRef.current = {
        requestId: null,
        state: 'failed',
      }
      setRequestId(null)
      setGenerationState('failed')
      setError(getErrorMessage(nextError))
      setNotice(null)
    })
  }, [])

  useEffect(() => {
    if (!window.electronAPI?.onGenerationEvent) {
      return undefined
    }

    return window.electronAPI.onGenerationEvent((event) => {
      const previousSession = generationSessionRef.current
      const lifecycleUpdate = applyGenerationEvent(previousSession, event)
      if (!lifecycleUpdate.accepted) {
        return
      }

      generationSessionRef.current = lifecycleUpdate.nextSession
      const nextState = lifecycleUpdate.nextSession.state
      const nextRequestId = lifecycleUpdate.nextSession.requestId
      const sessionChanged =
        previousSession.requestId !== nextRequestId ||
        previousSession.state !== nextState

      if (event.type === 'started') {
        composerActions.markAttachmentAnalyzing(event.state === 'generating' ? 60 : 25)
      }

      if (event.type === 'chunk') {
        outputActions.appendChunk(event.chunk)
        if (!hasStreamedChunkRef.current) {
          hasStreamedChunkRef.current = true
          composerActions.markAttachmentAnalyzing(85)
        }
      }

      if (sessionChanged) {
        setRequestId(nextRequestId)
        setGenerationState(nextState)
      }

      if (event.type === 'completed') {
        hasStreamedChunkRef.current = false
        setError(null)
        setNotice(null)
        outputActions.completeOutputSession()
        composerActions.clearAttachmentAfterGeneration()
        return
      }

      if (event.type === 'cancelled') {
        hasStreamedChunkRef.current = false
        setError(null)
        setNotice('Generation cancelled.')
        composerActions.clearAttachmentAfterGeneration()
        return
      }

      if (event.type === 'failed') {
        hasStreamedChunkRef.current = false
        setError(event.error.message)
        setNotice(null)
        composerActions.clearAttachmentAfterGeneration()
      }
    })
  }, [composerActions, outputActions])

  useEffect(() => {
    const handleKeyboardEvent = (event: KeyboardEvent) => {
      const action = getKeyboardGenerationAction(event, generationSessionRef.current.state)
      if (action === 'cancel') {
        event.preventDefault()
        cancelGeneration()
        return
      }
      if (action === 'start') {
        event.preventDefault()
        void startGeneration()
      }
    }

    window.addEventListener('keydown', handleKeyboardEvent)
    return () => window.removeEventListener('keydown', handleKeyboardEvent)
  }, [cancelGeneration, startGeneration])

  const canGenerate =
    composerState.inputText.trim().length > 0 &&
    !!runtimeState.selectedModelId &&
    !isGenerationInFlight(generationState) &&
    runtimeState.selectedModelInstalled &&
    runtimeState.selectedModelReady &&
    (!composerState.imageAttachment ||
      (composerState.imageAttachment.prepared &&
        !composerState.uploadError &&
        runtimeState.selectedModelVisionSupport === 'supported'))

  const stateValue = useMemo<GenerationStateValue>(() => ({
    requestId,
    generationState,
    error,
    notice,
    isGenerating: isGenerationInFlight(generationState),
    isStreaming: generationState === 'generating',
    isBusy: isGenerationInFlight(generationState),
  }), [error, generationState, notice, requestId])

  const controlsValue = useMemo<GenerationControlsValue>(() => ({
    canGenerate,
    startGeneration,
    cancelGeneration,
  }), [canGenerate, cancelGeneration, startGeneration])

  return (
    <GenerationStateContext.Provider value={stateValue}>
      <GenerationControlsContext.Provider value={controlsValue}>{children}</GenerationControlsContext.Provider>
    </GenerationStateContext.Provider>
  )
}
