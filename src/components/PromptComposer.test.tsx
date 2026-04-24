// @vitest-environment jsdom

import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const useComposerStateMock = vi.fn()
const useComposerActionsMock = vi.fn()
const useGenerationStateMock = vi.fn()
const useGenerationControlsMock = vi.fn()
const useRuntimeStateMock = vi.fn()

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
    })

    const html = renderToStaticMarkup(<PromptComposer />)

    expect(html).toContain('Input')
    expect(html).toContain('Raw intent')
    expect(html).toContain('Prompt settings')
    expect(html).toContain('Context and diagnostics')
    expect(html).toContain('Constraints')
    expect(html).toContain('Build Prompt')
    expect(html).toContain('Code')
    expect(html).toContain('Analysis')
    expect(html).toContain('Creative')
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
    })

    const html = renderToStaticMarkup(<PromptComposer />)

    expect(html).toContain('Add your raw intent to enable building.')
  })
})
