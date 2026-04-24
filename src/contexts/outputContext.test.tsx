// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OutputProvider, useOutputActions, useOutputMeta, useOutputText } from '@/contexts/outputContext'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('OutputProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    document.body.innerHTML = ''
  })

  it('keeps draft metadata stable while chunks append and resets cleanly between sessions', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const captured = {
      text: '',
      meta: {
        sourceValue: '',
        category: 'coding' as import('@/types').Category,
        hasOutput: false,
        draftText: '',
        currentTab: 'prompt' as import('@/types').WorkspaceTab,
      },
      actions: null as null | ReturnType<typeof useOutputActions>,
    }

    function Capture() {
      const text = useOutputText()
      const meta = useOutputMeta()
      const actions = useOutputActions()
      captured.text = text
      captured.meta = meta
      captured.actions = actions
      return null
    }

    await act(async () => {
      root.render(
        <OutputProvider>
          <Capture />
        </OutputProvider>,
      )
    })

    await act(async () => {
      captured.actions?.beginOutputSession({
        sourceValue: 'first rough prompt',
        briefText: 'first rough prompt',
        contextText: '',
        mustInclude: '',
        mustAvoid: '',
        outputShape: '',
        referenceMaterial: '',
        extraConstraints: [],
        hasImageAttachment: false,
        category: 'analysis',
        promptIntent: 'analyze',
        promptTarget: 'analysis',
        promptStrategy: 'balanced',
        requestMode: 'initial',
      })
      captured.actions?.appendChunk('hello')
      captured.actions?.appendChunk(' world')
      captured.actions?.completeOutputSession()
    })

    expect(captured.text).toBe('hello world')
    expect(captured.meta.sourceValue).toBe('first rough prompt')
    expect(captured.meta.category).toBe('analysis')
    expect(captured.meta.draftText).toBe('hello world')
    expect(captured.meta.hasOutput).toBe(true)

    await act(async () => {
      captured.actions?.setDraftText('edited prompt')
      captured.actions?.saveActiveVersion()
      captured.actions?.setCurrentTab('history')
    })

    expect(captured.text).toBe('edited prompt')
    expect(captured.meta.draftText).toBe('edited prompt')
    expect(captured.meta.versions).toHaveLength(1)
    expect(captured.meta.activeVersion?.saved).toBe(true)
    expect(captured.meta.currentTab).toBe('history')

    await act(async () => {
      captured.actions?.beginOutputSession({
        sourceValue: 'second prompt',
        briefText: 'second prompt',
        contextText: '',
        mustInclude: '',
        mustAvoid: '',
        outputShape: '',
        referenceMaterial: '',
        extraConstraints: [],
        hasImageAttachment: false,
        category: 'creative',
        promptIntent: 'create',
        promptTarget: 'creative',
        promptStrategy: 'balanced',
        requestMode: 'initial',
      })
    })

    expect(captured.text).toBe('')
    expect(captured.meta.sourceValue).toBe('second prompt')
    expect(captured.meta.category).toBe('creative')
    expect(captured.meta.hasOutput).toBe(false)

    await act(async () => {
      captured.actions?.clearOutput()
      root.unmount()
    })
  })

  it('rehydrates persisted versions, active version, and workspace tab from localStorage', async () => {
    const firstContainer = document.createElement('div')
    const firstRoot = createRoot(firstContainer)
    const firstCaptured = {
      meta: {
        draftText: '',
        currentTab: 'prompt' as import('@/types').WorkspaceTab,
        activeVersion: null as import('@/types').PromptVersion | null,
        versions: [] as import('@/types').PromptVersion[],
      },
      actions: null as null | ReturnType<typeof useOutputActions>,
    }

    function CaptureFirst() {
      const meta = useOutputMeta()
      const actions = useOutputActions()
      firstCaptured.meta = meta
      firstCaptured.actions = actions
      return null
    }

    await act(async () => {
      firstRoot.render(
        <OutputProvider>
          <CaptureFirst />
        </OutputProvider>,
      )
    })

    await act(async () => {
      firstCaptured.actions?.beginOutputSession({
        sourceValue: 'rough prompt',
        briefText: 'rough prompt',
        contextText: 'marketing page',
        mustInclude: 'hero copy',
        mustAvoid: '',
        outputShape: 'bullets',
        referenceMaterial: '',
        extraConstraints: ['keep it concise'],
        hasImageAttachment: false,
        category: 'creative',
        promptIntent: 'create',
        promptTarget: 'creative',
        promptStrategy: 'structured',
        requestMode: 'initial',
      })
      firstCaptured.actions?.appendChunk('draft prompt')
      firstCaptured.actions?.completeOutputSession()
    })

    await act(async () => {
      firstCaptured.actions?.setDraftText('draft prompt edited')
      firstCaptured.actions?.saveActiveVersion()
      firstCaptured.actions?.setCurrentTab('history')
    })

    expect(firstCaptured.meta.activeVersion?.saved).toBe(true)

    await act(async () => {
      firstRoot.unmount()
    })

    const secondContainer = document.createElement('div')
    const secondRoot = createRoot(secondContainer)
    const secondCaptured = {
      meta: {
        draftText: '',
        currentTab: 'prompt' as import('@/types').WorkspaceTab,
        activeVersion: null as import('@/types').PromptVersion | null,
        versions: [] as import('@/types').PromptVersion[],
      },
    }

    function CaptureSecond() {
      const meta = useOutputMeta()
      secondCaptured.meta = meta
      return null
    }

    await act(async () => {
      secondRoot.render(
        <OutputProvider>
          <CaptureSecond />
        </OutputProvider>,
      )
    })

    expect(secondCaptured.meta.draftText).toBe('draft prompt edited')
    expect(secondCaptured.meta.currentTab).toBe('history')
    expect(secondCaptured.meta.versions).toHaveLength(1)
    expect(secondCaptured.meta.activeVersion?.saved).toBe(true)
    expect(secondCaptured.meta.activeVersion?.promptText).toBe('draft prompt edited')

    await act(async () => {
      secondRoot.unmount()
    })
  })
})
