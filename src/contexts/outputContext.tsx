/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createVersionTitle } from '@/lib/promptWorkbench'
import type {
  Category,
  PromptIntent,
  PromptStrategy,
  PromptTarget,
  PromptVersion,
  PromptVersionKind,
  WorkspaceTab,
} from '@/types'

const OUTPUT_STORAGE_KEY = 'prompt-builder.output-state.v1'
const MAX_PERSISTED_VERSIONS = 50
const VALID_WORKSPACE_TABS: WorkspaceTab[] = ['prompt', 'compare', 'variants', 'history']

interface OutputSessionStart {
  sourceValue: string
  briefText: string
  contextText: string
  mustInclude: string
  mustAvoid: string
  outputShape: string
  referenceMaterial: string
  extraConstraints: string[]
  hasImageAttachment: boolean
  category: Category
  promptIntent: PromptIntent
  promptTarget: PromptTarget
  promptStrategy: PromptStrategy
  requestMode: PromptVersionKind
  requestLabel?: string | null
  parentVersionId?: string | null
}

interface OutputMetaValue {
  sourceValue: string
  briefText: string
  contextText: string
  mustInclude: string
  mustAvoid: string
  outputShape: string
  referenceMaterial: string
  extraConstraints: string[]
  hasImageAttachment: boolean
  category: Category
  promptIntent: PromptIntent
  promptTarget: PromptTarget
  promptStrategy: PromptStrategy
  draftText: string
  hasOutput: boolean
  versions: PromptVersion[]
  activeVersionId: string | null
  activeVersion: PromptVersion | null
  currentTab: WorkspaceTab
  currentRequestMode: PromptVersionKind
  currentRequestLabel: string | null
}

interface OutputActionsValue {
  beginOutputSession: (input: OutputSessionStart) => void
  appendChunk: (chunk: string) => void
  completeOutputSession: () => void
  clearOutput: () => void
  saveActiveVersion: () => void
  setActiveVersion: (versionId: string) => void
  setCurrentTab: (tab: WorkspaceTab) => void
  setDraftText: (nextValue: string) => void
}

interface PersistedOutputState {
  versions: PromptVersion[]
  activeVersionId: string | null
  currentTab: WorkspaceTab
}

const OutputTextContext = createContext<string | null>(null)
const OutputMetaContext = createContext<OutputMetaValue | null>(null)
const OutputActionsContext = createContext<OutputActionsValue | null>(null)

export function useOutputText() {
  const ctx = useContext(OutputTextContext)
  if (ctx === null) throw new Error('useOutputText must be used within OutputProvider')
  return ctx
}

export function useOutputMeta() {
  const ctx = useContext(OutputMetaContext)
  if (!ctx) throw new Error('useOutputMeta must be used within OutputProvider')
  return ctx
}

export function useOutputActions() {
  const ctx = useContext(OutputActionsContext)
  if (!ctx) throw new Error('useOutputActions must be used within OutputProvider')
  return ctx
}

interface OutputProviderProps {
  children: ReactNode
}

export function OutputProvider({ children }: OutputProviderProps) {
  const persistedState = useMemo(() => loadPersistedOutputState(), [])
  const initialActiveVersion = persistedState.activeVersionId
    ? persistedState.versions.find((version) => version.id === persistedState.activeVersionId) ?? null
    : null

  const [text, setText] = useState(initialActiveVersion?.promptText ?? '')
  const [sourceValue, setSourceValue] = useState(initialActiveVersion?.sourceValue ?? '')
  const [briefText, setBriefText] = useState(initialActiveVersion?.briefText ?? '')
  const [contextText, setContextText] = useState(initialActiveVersion?.contextText ?? '')
  const [mustInclude, setMustInclude] = useState(initialActiveVersion?.mustInclude ?? '')
  const [mustAvoid, setMustAvoid] = useState(initialActiveVersion?.mustAvoid ?? '')
  const [outputShape, setOutputShape] = useState(initialActiveVersion?.outputShape ?? '')
  const [referenceMaterial, setReferenceMaterial] = useState(initialActiveVersion?.referenceMaterial ?? '')
  const [extraConstraints, setExtraConstraints] = useState<string[]>(initialActiveVersion?.extraConstraints ?? [])
  const [hasImageAttachment, setHasImageAttachment] = useState(initialActiveVersion?.hasImageAttachment ?? false)
  const [category, setCategory] = useState<Category>(initialActiveVersion?.category ?? 'general')
  const [promptIntent, setPromptIntent] = useState<PromptIntent>(initialActiveVersion?.promptIntent ?? 'create')
  const [promptTarget, setPromptTarget] = useState<PromptTarget>(initialActiveVersion?.promptTarget ?? 'general')
  const [promptStrategy, setPromptStrategy] = useState<PromptStrategy>(initialActiveVersion?.promptStrategy ?? 'balanced')
  const [versions, setVersions] = useState<PromptVersion[]>(persistedState.versions)
  const [activeVersionId, setActiveVersionId] = useState<string | null>(persistedState.activeVersionId)
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>(persistedState.currentTab)
  const [currentRequestMode, setCurrentRequestMode] = useState<PromptVersionKind>(initialActiveVersion?.kind ?? 'initial')
  const [currentRequestLabel, setCurrentRequestLabel] = useState<string | null>(initialActiveVersion?.requestLabel ?? null)
  const textRef = useRef(initialActiveVersion?.promptText ?? '')
  const sourceValueRef = useRef(initialActiveVersion?.sourceValue ?? '')
  const briefTextRef = useRef(initialActiveVersion?.briefText ?? '')
  const contextTextRef = useRef(initialActiveVersion?.contextText ?? '')
  const mustIncludeRef = useRef(initialActiveVersion?.mustInclude ?? '')
  const mustAvoidRef = useRef(initialActiveVersion?.mustAvoid ?? '')
  const outputShapeRef = useRef(initialActiveVersion?.outputShape ?? '')
  const referenceMaterialRef = useRef(initialActiveVersion?.referenceMaterial ?? '')
  const extraConstraintsRef = useRef<string[]>(initialActiveVersion?.extraConstraints ?? [])
  const hasImageAttachmentRef = useRef(initialActiveVersion?.hasImageAttachment ?? false)
  const categoryRef = useRef<Category>(initialActiveVersion?.category ?? 'general')
  const promptIntentRef = useRef<PromptIntent>(initialActiveVersion?.promptIntent ?? 'create')
  const promptTargetRef = useRef<PromptTarget>(initialActiveVersion?.promptTarget ?? 'general')
  const promptStrategyRef = useRef<PromptStrategy>(initialActiveVersion?.promptStrategy ?? 'balanced')
  const requestModeRef = useRef<PromptVersionKind>(initialActiveVersion?.kind ?? 'initial')
  const requestLabelRef = useRef<string | null>(initialActiveVersion?.requestLabel ?? null)
  const parentVersionIdRef = useRef<string | null>(initialActiveVersion?.parentVersionId ?? null)

  const activeVersion = useMemo(() => (
    versions.find((version) => version.id === activeVersionId) ?? null
  ), [activeVersionId, versions])

  useEffect(() => {
    persistOutputState({
      versions,
      activeVersionId,
      currentTab,
    })
  }, [activeVersionId, currentTab, versions])

  useEffect(() => {
    if (activeVersionId && !versions.some((version) => version.id === activeVersionId)) {
      setActiveVersionId(null)
    }
  }, [activeVersionId, versions])

  const syncWorkingState = useCallback((version: PromptVersion) => {
    textRef.current = version.promptText
    sourceValueRef.current = version.sourceValue
    briefTextRef.current = version.briefText
    contextTextRef.current = version.contextText
    mustIncludeRef.current = version.mustInclude
    mustAvoidRef.current = version.mustAvoid
    outputShapeRef.current = version.outputShape
    referenceMaterialRef.current = version.referenceMaterial
    extraConstraintsRef.current = version.extraConstraints
    hasImageAttachmentRef.current = version.hasImageAttachment
    categoryRef.current = version.category
    promptIntentRef.current = version.promptIntent
    promptTargetRef.current = version.promptTarget
    promptStrategyRef.current = version.promptStrategy
    requestModeRef.current = version.kind
    requestLabelRef.current = version.requestLabel
    parentVersionIdRef.current = version.parentVersionId
    setText(version.promptText)
    setSourceValue(version.sourceValue)
    setBriefText(version.briefText)
    setContextText(version.contextText)
    setMustInclude(version.mustInclude)
    setMustAvoid(version.mustAvoid)
    setOutputShape(version.outputShape)
    setReferenceMaterial(version.referenceMaterial)
    setExtraConstraints(version.extraConstraints)
    setHasImageAttachment(version.hasImageAttachment)
    setCategory(version.category)
    setPromptIntent(version.promptIntent)
    setPromptTarget(version.promptTarget)
    setPromptStrategy(version.promptStrategy)
    setCurrentRequestMode(version.kind)
    setCurrentRequestLabel(version.requestLabel)
  }, [])

  const setDraftText = useCallback((nextValue: string) => {
    textRef.current = nextValue
    setText(nextValue)
  }, [])

  const beginOutputSession = useCallback((input: OutputSessionStart) => {
    sourceValueRef.current = input.sourceValue
    briefTextRef.current = input.briefText
    contextTextRef.current = input.contextText
    mustIncludeRef.current = input.mustInclude
    mustAvoidRef.current = input.mustAvoid
    outputShapeRef.current = input.outputShape
    referenceMaterialRef.current = input.referenceMaterial
    extraConstraintsRef.current = input.extraConstraints
    hasImageAttachmentRef.current = input.hasImageAttachment
    categoryRef.current = input.category
    promptIntentRef.current = input.promptIntent
    promptTargetRef.current = input.promptTarget
    promptStrategyRef.current = input.promptStrategy
    requestModeRef.current = input.requestMode
    requestLabelRef.current = input.requestLabel ?? null
    parentVersionIdRef.current = input.parentVersionId ?? null
    textRef.current = ''
    setSourceValue(input.sourceValue)
    setBriefText(input.briefText)
    setContextText(input.contextText)
    setMustInclude(input.mustInclude)
    setMustAvoid(input.mustAvoid)
    setOutputShape(input.outputShape)
    setReferenceMaterial(input.referenceMaterial)
    setExtraConstraints(input.extraConstraints)
    setHasImageAttachment(input.hasImageAttachment)
    setCategory(input.category)
    setPromptIntent(input.promptIntent)
    setPromptTarget(input.promptTarget)
    setPromptStrategy(input.promptStrategy)
    setCurrentRequestMode(input.requestMode)
    setCurrentRequestLabel(input.requestLabel ?? null)
    setText('')
    setActiveVersionId(null)
    setCurrentTab('prompt')
  }, [])

  const appendChunk = useCallback((chunk: string) => {
    textRef.current += chunk
    setText((currentValue) => currentValue + chunk)
  }, [])

  const completeOutputSession = useCallback(() => {
    setVersions((currentVersions) => {
      const promptText = textRef.current.trim()
      if (!promptText) return currentVersions

      const nextVersion: PromptVersion = {
        id: createVersionId(),
        title: createVersionTitle(requestModeRef.current, currentVersions.length + 1, requestLabelRef.current),
        promptText,
        sourceValue: sourceValueRef.current,
        briefText: briefTextRef.current,
        contextText: contextTextRef.current,
        mustInclude: mustIncludeRef.current,
        mustAvoid: mustAvoidRef.current,
        outputShape: outputShapeRef.current,
        referenceMaterial: referenceMaterialRef.current,
        extraConstraints: extraConstraintsRef.current,
        hasImageAttachment: hasImageAttachmentRef.current,
        category: categoryRef.current,
        promptIntent: promptIntentRef.current,
        promptTarget: promptTargetRef.current,
        promptStrategy: promptStrategyRef.current,
        kind: requestModeRef.current,
        parentVersionId: parentVersionIdRef.current,
        requestLabel: requestLabelRef.current,
        createdAt: new Date().toISOString(),
        saved: false,
      }

      setActiveVersionId(nextVersion.id)
      return trimVersions([nextVersion, ...currentVersions])
    })
  }, [])

  const clearOutput = useCallback(() => {
    textRef.current = ''
    setText('')
    setActiveVersionId(null)
    setCurrentTab('prompt')
  }, [])

  const saveActiveVersion = useCallback(() => {
    const promptText = textRef.current.trim()
    if (!promptText) return

    setVersions((currentVersions) => {
      if (activeVersionId) {
        const hasActiveVersion = currentVersions.some((version) => version.id === activeVersionId)
        if (hasActiveVersion) {
          return currentVersions.map((version) => (
            version.id === activeVersionId
              ? {
                  ...version,
                  promptText,
                  sourceValue: sourceValueRef.current,
                  briefText: briefTextRef.current,
                  contextText: contextTextRef.current,
                  mustInclude: mustIncludeRef.current,
                  mustAvoid: mustAvoidRef.current,
                  outputShape: outputShapeRef.current,
                  referenceMaterial: referenceMaterialRef.current,
                  extraConstraints: extraConstraintsRef.current,
                  hasImageAttachment: hasImageAttachmentRef.current,
                  category: categoryRef.current,
                  promptIntent: promptIntentRef.current,
                  promptTarget: promptTargetRef.current,
                  promptStrategy: promptStrategyRef.current,
                  requestLabel: requestLabelRef.current,
                  saved: true,
                }
              : version
          ))
        }
      }

      const nextVersion: PromptVersion = {
        id: createVersionId(),
        title: createVersionTitle(requestModeRef.current, currentVersions.length + 1, requestLabelRef.current),
        promptText,
        sourceValue: sourceValueRef.current,
        briefText: briefTextRef.current,
        contextText: contextTextRef.current,
        mustInclude: mustIncludeRef.current,
        mustAvoid: mustAvoidRef.current,
        outputShape: outputShapeRef.current,
        referenceMaterial: referenceMaterialRef.current,
        extraConstraints: extraConstraintsRef.current,
        hasImageAttachment: hasImageAttachmentRef.current,
        category: categoryRef.current,
        promptIntent: promptIntentRef.current,
        promptTarget: promptTargetRef.current,
        promptStrategy: promptStrategyRef.current,
        kind: requestModeRef.current,
        parentVersionId: parentVersionIdRef.current,
        requestLabel: requestLabelRef.current,
        createdAt: new Date().toISOString(),
        saved: true,
      }

      setActiveVersionId(nextVersion.id)
      return trimVersions([nextVersion, ...currentVersions])
    })
  }, [activeVersionId])

  const setActiveVersion = useCallback((versionId: string) => {
    const version = versions.find((entry) => entry.id === versionId)
    if (!version) return

    setActiveVersionId(version.id)
    syncWorkingState(version)
  }, [syncWorkingState, versions])

  const metaValue = useMemo<OutputMetaValue>(() => ({
    sourceValue,
    briefText,
    contextText,
    mustInclude,
    mustAvoid,
    outputShape,
    referenceMaterial,
    extraConstraints,
    hasImageAttachment,
    category,
    promptIntent,
    promptTarget,
    promptStrategy,
    draftText: text,
    hasOutput: text.trim().length > 0,
    versions,
    activeVersionId,
    activeVersion,
    currentTab,
    currentRequestMode,
    currentRequestLabel,
  }), [
    activeVersion,
    activeVersionId,
    briefText,
    category,
    contextText,
    currentRequestLabel,
    currentRequestMode,
    currentTab,
    extraConstraints,
    hasImageAttachment,
    mustAvoid,
    mustInclude,
    outputShape,
    promptIntent,
    promptStrategy,
    promptTarget,
    referenceMaterial,
    sourceValue,
    text,
    versions,
  ])

  const actionsValue = useMemo<OutputActionsValue>(() => ({
    beginOutputSession,
    appendChunk,
    completeOutputSession,
    clearOutput,
    saveActiveVersion,
    setActiveVersion,
    setCurrentTab,
    setDraftText,
  }), [
    appendChunk,
    beginOutputSession,
    clearOutput,
    completeOutputSession,
    saveActiveVersion,
    setActiveVersion,
    setDraftText,
  ])

  return (
    <OutputTextContext.Provider value={text}>
      <OutputMetaContext.Provider value={metaValue}>
        <OutputActionsContext.Provider value={actionsValue}>{children}</OutputActionsContext.Provider>
      </OutputMetaContext.Provider>
    </OutputTextContext.Provider>
  )
}

function createVersionId() {
  return window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function trimVersions(versions: PromptVersion[]) {
  return versions.slice(0, MAX_PERSISTED_VERSIONS)
}

function loadPersistedOutputState(): PersistedOutputState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      versions: [],
      activeVersionId: null,
      currentTab: 'prompt',
    }
  }

  try {
    const rawValue = window.localStorage.getItem(OUTPUT_STORAGE_KEY)
    if (!rawValue) {
      return {
        versions: [],
        activeVersionId: null,
        currentTab: 'prompt',
      }
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedOutputState>
    const versions = Array.isArray(parsed.versions)
      ? trimVersions(parsed.versions.filter(Boolean) as PromptVersion[])
      : []
    const activeVersionId = typeof parsed.activeVersionId === 'string'
      ? parsed.activeVersionId
      : null
    const currentTab = VALID_WORKSPACE_TABS.includes(parsed.currentTab as WorkspaceTab)
      ? parsed.currentTab as WorkspaceTab
      : 'prompt'

    return {
      versions,
      activeVersionId: activeVersionId && versions.some((version) => version.id === activeVersionId)
        ? activeVersionId
        : null,
      currentTab,
    }
  } catch {
    return {
      versions: [],
      activeVersionId: null,
      currentTab: 'prompt',
    }
  }
}

function persistOutputState(state: PersistedOutputState) {
  if (typeof window === 'undefined' || !window.localStorage) return

  window.localStorage.setItem(OUTPUT_STORAGE_KEY, JSON.stringify({
    versions: trimVersions(state.versions),
    activeVersionId: state.activeVersionId,
    currentTab: state.currentTab,
  }))
}
