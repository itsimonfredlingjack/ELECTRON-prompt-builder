// @vitest-environment jsdom

import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const useComposerStateMock = vi.fn()
const useComposerActionsMock = vi.fn()
const useGenerationStateMock = vi.fn()
const useGenerationControlsMock = vi.fn()
const useRuntimeStateMock = vi.fn()
const useRuntimeActionsMock = vi.fn()

vi.mock('@/contexts/composerContext', () => ({
  useComposerState: () => useComposerStateMock(),
  useComposerActions: () => useComposerActionsMock(),
}))

vi.mock('@/contexts/generationContext', () => ({
  useGenerationState: () => useGenerationStateMock(),
  useGenerationControls: () => useGenerationControlsMock(),
}))

vi.mock('@/contexts/runtimeContext', () => ({
  useRuntimeState: () => useRuntimeStateMock(),
  useRuntimeActions: () => useRuntimeActionsMock(),
}))

import { PromptComposer } from '@/components/PromptComposer'

function createComposerState(overrides: Record<string, unknown> = {}) {
  return {
    category: 'general',
    promptIntent: 'create',
    promptTarget: 'general',
    promptStrategy: 'balanced',
    inputText: '',
    contextText: '',
    mustInclude: '',
    mustAvoid: '',
    outputShape: '',
    referenceMaterial: '',
    extraConstraints: [],
    imageAttachment: null,
    uploadStatus: 'idle',
    uploadProgress: 0,
    uploadError: null,
    ...overrides,
  }
}

function createComposerActions(overrides: Record<string, unknown> = {}) {
  return {
    setInputText: vi.fn(),
    setContextText: vi.fn(),
    setMustInclude: vi.fn(),
    setMustAvoid: vi.fn(),
    setOutputShape: vi.fn(),
    setReferenceMaterial: vi.fn(),
    setPromptIntent: vi.fn(),
    setPromptTarget: vi.fn(),
    setPromptStrategy: vi.fn(),
    addExtraConstraint: vi.fn(),
    removeExtraConstraint: vi.fn(),
    attachFile: vi.fn(),
    clearAttachment: vi.fn(),
    ...overrides,
  }
}

async function renderPromptComposer() {
  const container = document.createElement('div')
  const root = createRoot(container)

  await act(async () => {
    root.render(<PromptComposer />)
  })

  return { container, root }
}

describe('PromptComposer', () => {
  beforeEach(() => {
    useRuntimeActionsMock.mockReturnValue({ refreshRuntime: vi.fn() })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the compact prompt brief controls', () => {
    useComposerStateMock.mockReturnValue(createComposerState())
    useComposerActionsMock.mockReturnValue(createComposerActions())
    useGenerationStateMock.mockReturnValue({ isBusy: false, generationState: 'idle', error: null, notice: null })
    useGenerationControlsMock.mockReturnValue({ canGenerate: false, startGeneration: vi.fn(), cancelGeneration: vi.fn() })
    useRuntimeStateMock.mockReturnValue({
      selectedModelId: 'gemma4:e4b',
      selectedModelInstalled: true,
      selectedModelReady: true,
      selectedModelVisionSupport: 'supported',
    })

    const html = renderToStaticMarkup(<PromptComposer />)

    expect(html).toContain('Brief')
    expect(html).toContain('Raw intent')
    expect(html).toContain('Context')
    expect(html).toContain('Advanced')
    expect(html).toContain('Sharpen')
    expect(html).not.toContain('Must include')
    expect(html).not.toContain('Reference material')
  })

  it('keeps advanced controls collapsed until opened', async () => {
    useComposerStateMock.mockReturnValue(createComposerState())
    useComposerActionsMock.mockReturnValue(createComposerActions())
    useGenerationStateMock.mockReturnValue({ isBusy: false, generationState: 'idle', error: null, notice: null })
    useGenerationControlsMock.mockReturnValue({ canGenerate: false, startGeneration: vi.fn(), cancelGeneration: vi.fn() })
    useRuntimeStateMock.mockReturnValue({
      selectedModelId: 'gemma4:e4b',
      selectedModelInstalled: true,
      selectedModelReady: true,
      selectedModelVisionSupport: 'supported',
    })

    const { container, root } = await renderPromptComposer()

    expect(container.textContent).not.toContain('Must include')
    const advancedToggle = Array.from(container.querySelectorAll('button')).find((btn) => btn.textContent?.includes('Advanced'))
    expect(advancedToggle).toBeTruthy()

    await act(async () => {
      advancedToggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(advancedToggle?.getAttribute('aria-expanded')).toBe('true')
    expect(container.textContent).toContain('Include')
    expect(container.textContent).toContain('Pinned rule')

    const settingsTab = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Settings')
    await act(async () => {
      settingsTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.querySelector('select#brief-intent')).toBeTruthy()
    expect(container.querySelector('select#brief-target')).toBeTruthy()
    expect(container.querySelector('select#brief-strategy')).toBeTruthy()

    await act(async () => {
      root.unmount()
    })
  })

  it('keeps the raw intent label associated with the primary textarea', async () => {
    useComposerStateMock.mockReturnValue(createComposerState())
    useComposerActionsMock.mockReturnValue(createComposerActions())
    useGenerationStateMock.mockReturnValue({ isBusy: false, generationState: 'idle', error: null, notice: null })
    useGenerationControlsMock.mockReturnValue({ canGenerate: false, startGeneration: vi.fn(), cancelGeneration: vi.fn() })
    useRuntimeStateMock.mockReturnValue({
      selectedModelId: 'gemma4:e4b',
      selectedModelInstalled: true,
      selectedModelReady: true,
      selectedModelVisionSupport: 'supported',
    })

    const { container, root } = await renderPromptComposer()

    const label = container.querySelector('label[for="prompt-goal"]')
    const textarea = container.querySelector('textarea#prompt-goal')

    expect(label).toBeTruthy()
    expect(textarea).toBeTruthy()
    expect(label?.getAttribute('for')).toBe(textarea?.getAttribute('id'))

    await act(async () => {
      root.unmount()
    })
  })

  it('shows disabled helper copy when generation cannot run', () => {
    useComposerStateMock.mockReturnValue(createComposerState({ inputText: '' }))
    useComposerActionsMock.mockReturnValue(createComposerActions())
    useGenerationStateMock.mockReturnValue({ isBusy: false, generationState: 'idle', error: null, notice: null })
    useGenerationControlsMock.mockReturnValue({ canGenerate: false, startGeneration: vi.fn(), cancelGeneration: vi.fn() })
    useRuntimeStateMock.mockReturnValue({
      selectedModelId: 'gemma4:e4b',
      selectedModelInstalled: true,
      selectedModelReady: true,
      selectedModelVisionSupport: 'supported',
    })

    const html = renderToStaticMarkup(<PromptComposer />)

    expect(html).toContain('Add your raw intent to enable building.')
  })
})
