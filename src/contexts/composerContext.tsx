/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { validateSelectedImage } from '@/lib/ollama'
import { mapCategoryToTarget, mapTargetToCategory } from '@/lib/promptWorkbench'
import { useRuntimeState } from '@/contexts/runtimeContext'
import type {
  AppError,
  Category,
  ImageAttachment,
  PromptIntent,
  PromptStrategy,
  PromptTarget,
  UploadStatus,
} from '@/types'

interface ComposerStateValue {
  category: Category
  promptIntent: PromptIntent
  promptTarget: PromptTarget
  promptStrategy: PromptStrategy
  inputText: string
  contextText: string
  mustInclude: string
  mustAvoid: string
  outputShape: string
  referenceMaterial: string
  extraConstraints: string[]
  imageAttachment: ImageAttachment | null
  uploadStatus: UploadStatus
  uploadProgress: number
  uploadError: AppError | null
}

interface ComposerActionsValue {
  setCategory: (category: Category) => void
  setPromptIntent: (intent: PromptIntent) => void
  setPromptTarget: (target: PromptTarget) => void
  setPromptStrategy: (strategy: PromptStrategy) => void
  setInputText: (value: string) => void
  setContextText: (value: string) => void
  setMustInclude: (value: string) => void
  setMustAvoid: (value: string) => void
  setOutputShape: (value: string) => void
  setReferenceMaterial: (value: string) => void
  addExtraConstraint: (value: string) => void
  removeExtraConstraint: (value: string) => void
  attachFile: (file: File) => Promise<void>
  clearAttachment: () => void
  markAttachmentAnalyzing: (progress: number) => void
  clearAttachmentAfterGeneration: () => void
  reportUploadError: (error: AppError | null) => void
  markAttachmentFailure: () => void
}

const ComposerStateContext = createContext<ComposerStateValue | null>(null)
const ComposerActionsContext = createContext<ComposerActionsValue | null>(null)

export function useComposerState() {
  const ctx = useContext(ComposerStateContext)
  if (!ctx) throw new Error('useComposerState must be used within ComposerProvider')
  return ctx
}

export function useComposerActions() {
  const ctx = useContext(ComposerActionsContext)
  if (!ctx) throw new Error('useComposerActions must be used within ComposerProvider')
  return ctx
}

interface ComposerProviderProps {
  children: ReactNode
}

export function ComposerProvider({ children }: ComposerProviderProps) {
  const runtimeState = useRuntimeState()
  const [category, setCategoryState] = useState<Category>('general')
  const [promptIntent, setPromptIntent] = useState<PromptIntent>('create')
  const [promptTarget, setPromptTargetState] = useState<PromptTarget>('general')
  const [promptStrategy, setPromptStrategy] = useState<PromptStrategy>('balanced')
  const [inputText, setInputText] = useState('')
  const [contextText, setContextText] = useState('')
  const [mustInclude, setMustInclude] = useState('')
  const [mustAvoid, setMustAvoid] = useState('')
  const [outputShape, setOutputShape] = useState('')
  const [referenceMaterial, setReferenceMaterial] = useState('')
  const [extraConstraints, setExtraConstraints] = useState<string[]>([])
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<AppError | null>(null)
  const attachmentOperationIdRef = useRef(0)
  const attachmentRef = useRef<ImageAttachment | null>(null)
  const runtimeRef = useRef({
    selectedModelId: runtimeState.selectedModelId,
    selectedModelInstalled: runtimeState.selectedModelInstalled,
    selectedModelVisionSupport: runtimeState.selectedModelVisionSupport,
  })

  useEffect(() => {
    attachmentRef.current = imageAttachment
  }, [imageAttachment])

  useEffect(() => {
    runtimeRef.current = {
      selectedModelId: runtimeState.selectedModelId,
      selectedModelInstalled: runtimeState.selectedModelInstalled,
      selectedModelVisionSupport: runtimeState.selectedModelVisionSupport,
    }
  }, [
    runtimeState.selectedModelId,
    runtimeState.selectedModelInstalled,
    runtimeState.selectedModelVisionSupport,
  ])

  useEffect(() => {
    return () => {
      cleanupImageAttachment(attachmentRef.current)
    }
  }, [])

  const setCategory = useCallback((nextCategory: Category) => {
    setCategoryState(nextCategory)
    setPromptTargetState(mapCategoryToTarget(nextCategory))
  }, [])

  const setPromptTarget = useCallback((nextTarget: PromptTarget) => {
    setPromptTargetState(nextTarget)
    setCategoryState(mapTargetToCategory(nextTarget))
  }, [])

  const invalidateAttachmentOperations = useCallback(() => {
    attachmentOperationIdRef.current += 1
    return attachmentOperationIdRef.current
  }, [])

  const clearAttachmentState = useCallback(() => {
    setImageAttachment(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    setUploadError(null)
  }, [])

  const clearAttachment = useCallback(() => {
    invalidateAttachmentOperations()
    cleanupImageAttachment(attachmentRef.current)
    clearAttachmentState()
  }, [clearAttachmentState, invalidateAttachmentOperations])

  const clearAttachmentAfterGeneration = useCallback(() => {
    invalidateAttachmentOperations()
    cleanupImageAttachment(attachmentRef.current)
    clearAttachmentState()
  }, [clearAttachmentState, invalidateAttachmentOperations])

  const reportUploadError = useCallback((error: AppError | null) => {
    setUploadError(error)
    setUploadStatus(error ? 'error' : 'idle')
    setUploadProgress(0)
  }, [])

  const markAttachmentFailure = useCallback(() => {
    if (!attachmentRef.current) return
    setUploadStatus('error')
  }, [])

  const markAttachmentAnalyzing = useCallback((progress: number) => {
    if (!attachmentRef.current) return
    setUploadStatus('analyzing')
    setUploadProgress((currentProgress) => Math.max(currentProgress, progress))
    setUploadError(null)
  }, [])

  const addExtraConstraint = useCallback((value: string) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return

    setExtraConstraints((currentValue) => (
      currentValue.some((constraint) => constraint.toLowerCase() === normalizedValue.toLowerCase())
        ? currentValue
        : [...currentValue, normalizedValue]
    ))
  }, [])

  const removeExtraConstraint = useCallback((value: string) => {
    setExtraConstraints((currentValue) => (
      currentValue.filter((constraint) => constraint !== value)
    ))
  }, [])

  const attachFile = useCallback(async (file: File) => {
    const operationId = invalidateAttachmentOperations()
    const { selectedModelId, selectedModelInstalled, selectedModelVisionSupport } = runtimeRef.current

    if (!selectedModelId || !selectedModelInstalled) {
      const nextError = toModelStateError('Select an installed Ollama model before attaching an image.')
      setUploadStatus('error')
      setUploadProgress(0)
      setUploadError(nextError)
      return
    }

    if (selectedModelVisionSupport !== 'supported') {
      const nextError = toModelStateError(
        'Image analysis is available only when the selected model explicitly reports vision support.',
      )
      setUploadStatus('error')
      setUploadProgress(0)
      setUploadError(nextError)
      return
    }

    const validationError = validateSelectedImage(file, selectedModelVisionSupport)
    if (validationError) {
      setUploadStatus('error')
      setUploadProgress(0)
      setUploadError(validationError)
      return
    }

    const nativeFilePath = getNativeFilePath(file)
    if (!nativeFilePath) {
      const nextError = toModelStateError('Native file path is unavailable. Re-select the image from local disk and try again.')
      setUploadStatus('error')
      setUploadProgress(0)
      setUploadError(nextError)
      return
    }

    cleanupImageAttachment(attachmentRef.current)

    const previewUrl = URL.createObjectURL(file)
    setImageAttachment({
      name: file.name,
      size: file.size,
      mimeType: file.type,
      previewUrl,
      tempId: null,
      prepared: false,
    })
    setUploadStatus('validating')
    setUploadProgress(15)
    setUploadError(null)

    try {
      setUploadStatus('uploading')
      setUploadProgress(35)

      const prepared = await window.electronAPI.prepareImageUpload({
        name: file.name,
        type: file.type,
        size: file.size,
        filePath: nativeFilePath,
      })

      if (attachmentOperationIdRef.current !== operationId) {
        void window.electronAPI.clearPreparedImage(prepared.tempId)
        return
      }

      setImageAttachment((currentAttachment) => (
        currentAttachment && currentAttachment.previewUrl === previewUrl
          ? {
              ...currentAttachment,
              tempId: prepared.tempId,
              prepared: true,
              mimeType: prepared.mimeType,
              size: prepared.size,
            }
          : currentAttachment
      ))
      setUploadStatus('ready')
      setUploadProgress(100)
    } catch (error) {
      if (attachmentOperationIdRef.current !== operationId) {
        return
      }

      setImageAttachment((currentAttachment) => (
        currentAttachment
          ? {
              ...currentAttachment,
              tempId: null,
              prepared: false,
            }
          : null
      ))
      setUploadStatus('error')
      setUploadProgress(0)
      setUploadError(normalizeUploadError(error))
    }
  }, [invalidateAttachmentOperations])

  const stateValue = useMemo<ComposerStateValue>(() => ({
    category,
    promptIntent,
    promptTarget,
    promptStrategy,
    inputText,
    contextText,
    mustInclude,
    mustAvoid,
    outputShape,
    referenceMaterial,
    extraConstraints,
    imageAttachment,
    uploadStatus,
    uploadProgress,
    uploadError,
  }), [
    category,
    contextText,
    extraConstraints,
    imageAttachment,
    inputText,
    mustAvoid,
    mustInclude,
    outputShape,
    promptIntent,
    promptStrategy,
    promptTarget,
    referenceMaterial,
    uploadError,
    uploadProgress,
    uploadStatus,
  ])

  const actionsValue = useMemo<ComposerActionsValue>(() => ({
    setCategory,
    setPromptIntent,
    setPromptTarget,
    setPromptStrategy,
    setInputText,
    setContextText,
    setMustInclude,
    setMustAvoid,
    setOutputShape,
    setReferenceMaterial,
    addExtraConstraint,
    removeExtraConstraint,
    attachFile,
    clearAttachment,
    markAttachmentAnalyzing,
    clearAttachmentAfterGeneration,
    reportUploadError,
    markAttachmentFailure,
  }), [
    addExtraConstraint,
    attachFile,
    clearAttachment,
    clearAttachmentAfterGeneration,
    markAttachmentAnalyzing,
    markAttachmentFailure,
    reportUploadError,
    removeExtraConstraint,
    setCategory,
    setPromptTarget,
  ])

  return (
    <ComposerStateContext.Provider value={stateValue}>
      <ComposerActionsContext.Provider value={actionsValue}>{children}</ComposerActionsContext.Provider>
    </ComposerStateContext.Provider>
  )
}

function cleanupImageAttachment(attachment: ImageAttachment | null) {
  if (attachment?.tempId) {
    void window.electronAPI.clearPreparedImage(attachment.tempId)
  }
  if (attachment?.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}

function toModelStateError(message: string): AppError {
  return {
    code: 'MODEL_NOT_SUPPORTED',
    message,
  }
}

function normalizeUploadError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null && 'message' in error && 'code' in error) {
    return error as AppError
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unexpected upload error.',
  }
}

function getNativeFilePath(file: File): string | null {
  const maybeNativeFile = file as File & { path?: string }
  if (typeof maybeNativeFile.path === 'string' && maybeNativeFile.path.trim().length > 0) {
    return maybeNativeFile.path
  }
  return null
}
