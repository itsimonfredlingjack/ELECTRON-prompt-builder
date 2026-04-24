// @vitest-environment jsdom

import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const useGenerationStateMock = vi.fn()
const useGenerationControlsMock = vi.fn()
const useRuntimeStateMock = vi.fn()

vi.mock('@/contexts/generationContext', () => ({
  useGenerationState: () => useGenerationStateMock(),
  useGenerationControls: () => useGenerationControlsMock(),
}))

vi.mock('@/contexts/runtimeContext', () => ({
  useRuntimeState: () => useRuntimeStateMock(),
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
}: HarnessProps & { isStreaming: boolean; canGenerate?: boolean }) {
  const startGeneration = vi.fn()
  useGenerationStateMock.mockReturnValue({
    isStreaming,
    isBusy: isStreaming,
    generationState: isStreaming ? 'generating' : 'completed',
  })
  useGenerationControlsMock.mockReturnValue({
    startGeneration,
    canGenerate,
  })
  useRuntimeStateMock.mockReturnValue({
    selectedModelId: 'gemma4:e4b',
    selectedModelReady: true,
    runtimeSnapshot: {
      daemonReachable: true,
    },
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

  return { container, root, startGeneration }
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

    expect(container.textContent).toContain('Draft bay is empty')
    expect(container.textContent).toContain('Build a prompt from the input panel to start the draft.')

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
    expect(container.textContent).toContain('Generated prompt draft')

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
