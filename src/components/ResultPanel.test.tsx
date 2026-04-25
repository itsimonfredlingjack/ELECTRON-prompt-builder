// @vitest-environment jsdom

import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const useGenerationStateMock = vi.fn()
const useGenerationControlsMock = vi.fn()
const useRuntimeStateMock = vi.fn()
const useRuntimeActionsMock = vi.fn()

vi.mock('@/contexts/generationContext', () => ({
  useGenerationState: () => useGenerationStateMock(),
  useGenerationControls: () => useGenerationControlsMock(),
}))

vi.mock('@/contexts/runtimeContext', () => ({
  useRuntimeState: () => useRuntimeStateMock(),
  useRuntimeActions: () => useRuntimeActionsMock(),
}))

import { ResultPanel } from '@/components/ResultPanel'
import { OutputProvider, useOutputActions } from '@/contexts/outputContext'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

interface HarnessProps {
  value: string
  sourceValue: string
}

function Harness({ value, sourceValue }: HarnessProps) {
  const { beginOutputSession, appendChunk, completeOutputSession, clearOutput } = useOutputActions()

  useEffect(() => {
    clearOutput()
    beginOutputSession({
      sourceValue,
      briefText: sourceValue,
      contextText: '',
      mustInclude: '',
      mustAvoid: '',
      outputShape: '',
      referenceMaterial: '',
      extraConstraints: [],
      hasImageAttachment: false,
      category: 'general',
      promptIntent: 'create',
      promptTarget: 'general',
      promptStrategy: 'balanced',
      requestMode: 'initial',
    })
    if (value) {
      appendChunk(value)
      completeOutputSession()
    }
  }, [appendChunk, beginOutputSession, clearOutput, completeOutputSession, sourceValue, value])

  return <ResultPanel />
}

async function renderResultPanel({
  value,
  sourceValue,
  isStreaming,
  canGenerate = true,
  daemonReachable = true,
  selectedModelReady = true,
  error = null,
}: HarnessProps & {
  isStreaming: boolean
  canGenerate?: boolean
  daemonReachable?: boolean
  selectedModelReady?: boolean
  error?: string | null
}) {
  const startGeneration = vi.fn()
  const refreshRuntime = vi.fn().mockResolvedValue(undefined)
  useGenerationStateMock.mockReturnValue({
    isStreaming,
    isBusy: isStreaming,
    generationState: isStreaming ? 'generating' : 'completed',
    error,
  })
  useGenerationControlsMock.mockReturnValue({
    startGeneration,
    canGenerate,
  })
  useRuntimeStateMock.mockReturnValue({
    selectedModelId: 'gemma4:e4b',
    selectedModelReady,
    runtimeRefreshing: false,
    runtimeSnapshot: {
      daemonReachable,
    },
  })
  useRuntimeActionsMock.mockReturnValue({
    refreshRuntime,
  })

  const container = document.createElement('div')
  const root = createRoot(container)

  await act(async () => {
    root.render(
      <OutputProvider>
        <Harness value={value} sourceValue={sourceValue} />
      </OutputProvider>,
    )
  })

  return { container, root, startGeneration, refreshRuntime }
}

describe('ResultPanel', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('renders the studio draft empty state', async () => {
    const { container, root } = await renderResultPanel({
      value: '',
      sourceValue: '',
      isStreaming: false,
      canGenerate: false,
    })

    expect(container.textContent).toContain('Draft is empty')
    expect(container.textContent).toContain('Write a brief on the left, then sharpen.')
    expect(container.textContent).toContain('sharpen')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows local Ollama recovery inside the draft pane when offline', async () => {
    const { container, root } = await renderResultPanel({
      value: '',
      sourceValue: '',
      isStreaming: false,
      canGenerate: false,
      daemonReachable: false,
      selectedModelReady: false,
    })

    expect(container.textContent).toContain('Start Ollama to draft locally.')
    expect(container.textContent).toContain('ollama serve')
    expect(container.textContent).toContain('use Retry beside Sharpen')

    await act(async () => {
      root.unmount()
    })
  })

  it('keeps the editor shell mounted while streaming before first token', async () => {
    const { container, root } = await renderResultPanel({
      value: '',
      sourceValue: 'turn this into a stricter prompt',
      isStreaming: true,
    })

    const textarea = container.querySelector('textarea')
    expect(textarea).toBeTruthy()
    expect(textarea?.getAttribute('placeholder')).toContain('Waiting for first token')
    expect(container.textContent).not.toContain('Draft is empty')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows minimal workspace actions when prompt output exists', async () => {
    const { container, root } = await renderResultPanel({
      value: 'Write a stricter prompt for debugging a flaky React test.',
      sourceValue: 'need a better prompt for a flaky react test',
      isStreaming: false,
    })

    expect(container.textContent).toContain('Copy')
    expect(container.textContent).toContain('Clear')
    expect(container.textContent).toContain('Regenerate')
    expect(container.textContent).toContain('Prompt draft')
    expect(container.textContent).toContain('Loaded draft')
    expect(container.textContent).toContain('need a better prompt for a flaky react test')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows provenance for a restored persisted draft', async () => {
    window.localStorage.setItem('prompt-builder.output-state.v1', JSON.stringify({
      activeVersionId: 'stored-v1',
      currentTab: 'prompt',
      versions: [{
        id: 'stored-v1',
        title: 'Initial draft 3',
        promptText: 'Write a release-ready review prompt.',
        sourceValue: 'review the UI before shipping',
        briefText: 'review the UI before shipping',
        contextText: '',
        mustInclude: '',
        mustAvoid: '',
        outputShape: '',
        referenceMaterial: '',
        extraConstraints: [],
        hasImageAttachment: false,
        category: 'general',
        promptIntent: 'critique',
        promptTarget: 'general',
        promptStrategy: 'balanced',
        kind: 'initial',
        parentVersionId: null,
        requestLabel: null,
        createdAt: '2026-04-24T10:00:00.000Z',
        saved: false,
      }],
    }))
    useGenerationStateMock.mockReturnValue({
      isStreaming: false,
      isBusy: false,
      generationState: 'completed',
      error: null,
    })
    useGenerationControlsMock.mockReturnValue({
      startGeneration: vi.fn(),
      canGenerate: false,
    })
    useRuntimeStateMock.mockReturnValue({
      selectedModelId: 'gemma4:e4b',
      selectedModelReady: true,
      runtimeRefreshing: false,
      runtimeSnapshot: {
        daemonReachable: true,
      },
    })
    useRuntimeActionsMock.mockReturnValue({
      refreshRuntime: vi.fn().mockResolvedValue(undefined),
    })

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <OutputProvider>
          <ResultPanel />
        </OutputProvider>,
      )
    })

    expect(container.textContent).toContain('Loaded draft')
    expect(container.textContent).toContain('review the UI before shipping')
    expect(container.textContent).toContain('Initial draft 3')
    expect(container.textContent).toContain('2026-04-24')
    expect(container.textContent).toContain('critique')

    await act(async () => {
      root.unmount()
    })
  })

  it('copies the active prompt text', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    })

    const promptValue = 'Write a stricter prompt for debugging a flaky React test.'
    const { container, root } = await renderResultPanel({
      value: promptValue,
      sourceValue: 'need a better prompt for a flaky react test',
      isStreaming: false,
    })

    const copyButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Copy'),
    )

    expect(copyButton).toBeTruthy()

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(clipboardWrite).toHaveBeenCalledWith(promptValue)
    expect(container.textContent).toContain('Copied')

    await act(async () => {
      root.unmount()
    })
  })

  it('dispatches regenerate from the top action bar', async () => {
    const promptValue = 'Write a stricter prompt for debugging a flaky React test.'
    const { container, root, startGeneration } = await renderResultPanel({
      value: promptValue,
      sourceValue: 'need a better prompt for a flaky react test',
      isStreaming: false,
      canGenerate: true,
    })

    const regenerateButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Regenerate'),
    )

    expect(regenerateButton).toBeTruthy()

    await act(async () => {
      regenerateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(startGeneration).toHaveBeenCalledWith()

    await act(async () => {
      root.unmount()
    })
  })
})
