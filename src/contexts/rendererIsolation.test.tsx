// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/contexts/AppProviders'
import { useComposerActions, useComposerState } from '@/contexts/composerContext'
import { useGenerationControls, useGenerationState } from '@/contexts/generationContext'
import { useOutputText } from '@/contexts/outputContext'
import { useRuntimeState } from '@/contexts/runtimeContext'
import type { AiGenerationEvent } from '@/types'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function createRuntimeSnapshot(selectedModelId: string | null) {
  return {
    daemonReachable: true,
    modelListAvailable: true,
    models: [{ id: 'llava:7b' }],
    selectedModelId,
    selectedModelInstalled: !!selectedModelId,
    selectedModelReady: !!selectedModelId,
    selectedModelVisionSupport: 'supported' as const,
    notice: null,
  }
}

describe('renderer state ownership', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('isolates streamed chunk updates to the output path and resets cleanly between requests', async () => {
    const generationListeners = new Set<(event: AiGenerationEvent) => void>()
    const startGeneration = vi.fn(async ({ requestId }: { requestId: string }) => ({ requestId }))
    const cancelGeneration = vi.fn().mockResolvedValue(undefined)

    ;(window as Window & { electronAPI: unknown }).electronAPI = {
      getRuntimeSnapshot: vi.fn(async ({ selectedModelId }: { selectedModelId: string | null }) =>
        createRuntimeSnapshot(selectedModelId),
      ),
      refreshRuntimeSnapshot: vi.fn(async ({ selectedModelId }: { selectedModelId: string | null }) =>
        createRuntimeSnapshot(selectedModelId),
      ),
      prepareImageUpload: vi.fn(),
      clearPreparedImage: vi.fn().mockResolvedValue(undefined),
      startGeneration,
      cancelGeneration,
      onGenerationEvent: (callback: (event: AiGenerationEvent) => void) => {
        generationListeners.add(callback)
        return () => generationListeners.delete(callback)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const container = document.createElement('div')
    const root = createRoot(container)
    const renderCounts = {
      header: 0,
      input: 0,
      output: 0,
      status: 0,
    }
    const captured = {
      setInputText: null as null | ((value: string) => void),
      startGeneration: null as null | (() => Promise<void>),
      cancelGeneration: null as null | (() => void),
      requestId: null as string | null,
      selectedModelId: null as string | null,
      generationState: 'idle',
      outputText: '',
    }

    function HeaderProbe() {
      renderCounts.header += 1
      const { selectedModelId } = useRuntimeState()
      const { isBusy } = useGenerationState()
      captured.selectedModelId = selectedModelId
      return <div data-probe="header">{String(isBusy)}</div>
    }

    function InputProbe() {
      renderCounts.input += 1
      const { inputText } = useComposerState()
      const { setInputText } = useComposerActions()
      const { isBusy } = useGenerationState()
      captured.setInputText = setInputText
      return <div data-probe="input">{`${inputText}:${String(isBusy)}`}</div>
    }

    function OutputProbe() {
      renderCounts.output += 1
      const text = useOutputText()
      captured.outputText = text
      return <div data-probe="output">{text}</div>
    }

    function StatusProbe() {
      renderCounts.status += 1
      const { generationState, requestId, isStreaming } = useGenerationState()
      const { startGeneration, cancelGeneration } = useGenerationControls()
      captured.startGeneration = startGeneration
      captured.cancelGeneration = cancelGeneration
      captured.requestId = requestId
      captured.generationState = generationState
      return <div data-probe="status">{`${generationState}:${String(isStreaming)}`}</div>
    }

    function Harness() {
      return (
        <>
          <HeaderProbe />
          <InputProbe />
          <OutputProbe />
          <StatusProbe />
        </>
      )
    }

    await act(async () => {
      root.render(
        <AppProviders>
          <Harness />
        </AppProviders>,
      )
    })

    expect(captured.selectedModelId).toBe('llava:7b')

    await act(async () => {
      captured.setInputText?.('first request')
    })

    await act(async () => {
      await captured.startGeneration?.()
    })

    const firstRequestId = captured.requestId
    expect(firstRequestId).toBeTruthy()

    await act(async () => {
      generationListeners.forEach((listener) => listener({
        requestId: firstRequestId as string,
        type: 'started',
        state: 'generating',
      }))
    })

    const beforeChunkCounts = { ...renderCounts }

    await act(async () => {
      generationListeners.forEach((listener) => listener({
        requestId: firstRequestId as string,
        type: 'chunk',
        chunk: 'Hello',
      }))
    })

    await act(async () => {
      generationListeners.forEach((listener) => listener({
        requestId: firstRequestId as string,
        type: 'chunk',
        chunk: ' world',
      }))
    })

    await act(async () => {
      generationListeners.forEach((listener) => listener({
        requestId: firstRequestId as string,
        type: 'chunk',
        chunk: '!',
      }))
    })

    expect(renderCounts.output - beforeChunkCounts.output).toBe(3)
    expect(renderCounts.header).toBe(beforeChunkCounts.header)
    expect(renderCounts.input).toBe(beforeChunkCounts.input)
    expect(renderCounts.status).toBe(beforeChunkCounts.status)
    expect(captured.outputText).toBe('Hello world!')

    await act(async () => {
      generationListeners.forEach((listener) => listener({
        requestId: firstRequestId as string,
        type: 'completed',
      }))
    })

    expect(captured.generationState).toBe('completed')

    await act(async () => {
      captured.setInputText?.('second request')
    })

    await act(async () => {
      await captured.startGeneration?.()
    })

    const secondRequestId = captured.requestId
    expect(secondRequestId).toBeTruthy()
    expect(secondRequestId).not.toBe(firstRequestId)
    expect(captured.outputText).toBe('')

    await act(async () => {
      generationListeners.forEach((listener) => listener({
        requestId: secondRequestId as string,
        type: 'chunk',
        chunk: 'Second',
      }))
    })

    expect(captured.outputText).toBe('Second')

    await act(async () => {
      captured.cancelGeneration?.()
    })

    expect(cancelGeneration).toHaveBeenCalledWith(secondRequestId)

    await act(async () => {
      generationListeners.forEach((listener) => listener({
        requestId: secondRequestId as string,
        type: 'cancelled',
      }))
    })

    expect(captured.generationState).toBe('cancelled')
    expect(captured.outputText).toBe('Second')

    await act(async () => {
      root.unmount()
    })
  })
})
