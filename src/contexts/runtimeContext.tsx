/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { resolveRuntimeSelection } from '@/lib/runtimeSelection'
import type { OllamaRuntimeSnapshot, VisionSupport } from '@/types'

interface RuntimeStateValue {
  selectedModelId: string | null
  runtimeSnapshot: OllamaRuntimeSnapshot | null
  runtimeRefreshing: boolean
  notice: string | null
  selectedModelInstalled: boolean
  selectedModelReady: boolean
  selectedModelVisionSupport: VisionSupport
}

interface RuntimeActionsValue {
  selectModel: (modelId: string | null) => void
  refreshRuntime: () => Promise<void>
  clearNotice: () => void
}

const RuntimeStateContext = createContext<RuntimeStateValue | null>(null)
const RuntimeActionsContext = createContext<RuntimeActionsValue | null>(null)

export function useRuntimeState() {
  const ctx = useContext(RuntimeStateContext)
  if (!ctx) throw new Error('useRuntimeState must be used within RuntimeProvider')
  return ctx
}

export function useRuntimeActions() {
  const ctx = useContext(RuntimeActionsContext)
  if (!ctx) throw new Error('useRuntimeActions must be used within RuntimeProvider')
  return ctx
}

interface RuntimeProviderProps {
  children: ReactNode
}

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<OllamaRuntimeSnapshot | null>(null)
  const [runtimeRefreshing, setRuntimeRefreshing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const runtimeRequestSequenceRef = useRef(0)
  const selectedModelRef = useRef<string | null>(null)

  useEffect(() => {
    selectedModelRef.current = selectedModelId
  }, [selectedModelId])

  const loadRuntimeSnapshot = useCallback(async (modelId: string | null, mode: 'get' | 'refresh' = 'get') => {
    const requestSequence = ++runtimeRequestSequenceRef.current
    setRuntimeRefreshing(true)

    try {
      const request = { selectedModelId: modelId }
      const snapshot =
        mode === 'refresh'
          ? await window.electronAPI.refreshRuntimeSnapshot(request)
          : await window.electronAPI.getRuntimeSnapshot(request)

      if (requestSequence !== runtimeRequestSequenceRef.current) {
        return
      }

      const resolvedSelection = resolveRuntimeSelection(modelId, snapshot)
      if (resolvedSelection.needsReload) {
        setSelectedModelId(resolvedSelection.nextModelId)
        setRuntimeSnapshot(null)
        setNotice(resolvedSelection.notice)
        return
      }

      setRuntimeSnapshot(snapshot)
      setNotice(resolvedSelection.notice)
    } catch {
      if (requestSequence !== runtimeRequestSequenceRef.current) {
        return
      }

      setRuntimeSnapshot({
        daemonReachable: false,
        modelListAvailable: false,
        models: [],
        selectedModelId: modelId,
        selectedModelInstalled: false,
        selectedModelReady: false,
        selectedModelVisionSupport: 'unknown',
        notice: 'Could not load Ollama runtime status.',
      })
      setNotice('Could not load Ollama runtime status.')
    } finally {
      if (requestSequence === runtimeRequestSequenceRef.current) {
        setRuntimeRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadRuntimeSnapshot(selectedModelId)
  }, [loadRuntimeSnapshot, selectedModelId])

  const selectModel = useCallback((modelId: string | null) => {
    setSelectedModelId(modelId)
    setRuntimeSnapshot(null)
    setNotice(null)
  }, [])

  const refreshRuntime = useCallback(async () => {
    await loadRuntimeSnapshot(selectedModelRef.current, 'refresh')
  }, [loadRuntimeSnapshot])

  const clearNotice = useCallback(() => {
    setNotice(null)
  }, [])

  const selectedSnapshotMatches = !!runtimeSnapshot && runtimeSnapshot.selectedModelId === selectedModelId

  const stateValue = useMemo<RuntimeStateValue>(() => ({
    selectedModelId,
    runtimeSnapshot,
    runtimeRefreshing,
    notice,
    selectedModelInstalled: selectedSnapshotMatches ? runtimeSnapshot.selectedModelInstalled : false,
    selectedModelReady: selectedSnapshotMatches ? runtimeSnapshot.selectedModelReady : false,
    selectedModelVisionSupport: selectedSnapshotMatches
      ? runtimeSnapshot.selectedModelVisionSupport
      : 'unknown',
  }), [notice, runtimeRefreshing, runtimeSnapshot, selectedModelId, selectedSnapshotMatches])

  const actionsValue = useMemo<RuntimeActionsValue>(() => ({
    selectModel,
    refreshRuntime,
    clearNotice,
  }), [clearNotice, refreshRuntime, selectModel])

  return (
    <RuntimeStateContext.Provider value={stateValue}>
      <RuntimeActionsContext.Provider value={actionsValue}>{children}</RuntimeActionsContext.Provider>
    </RuntimeStateContext.Provider>
  )
}
