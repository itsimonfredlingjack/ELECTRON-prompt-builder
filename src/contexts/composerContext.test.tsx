// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/runtimeContext', () => ({
  useRuntimeState: () => ({
    selectedModelId: 'llava:7b',
    selectedModelInstalled: true,
    selectedModelVisionSupport: 'supported',
  }),
}))

import { ComposerProvider, useComposerActions, useComposerState } from '@/contexts/composerContext'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('ComposerProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('keeps attachment state coherent through prepare, analyze, and terminal cleanup', async () => {
    const prepareImageUpload = vi.fn(async () => ({
      tempId: 'temp-1',
      mimeType: 'image/png',
      size: 8,
      maxBytes: 1024,
      expiresAt: new Date().toISOString(),
    }))
    const clearPreparedImage = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob://preview'),
      revokeObjectURL: vi.fn(),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as Window & { electronAPI: any }).electronAPI = {
      prepareImageUpload,
      clearPreparedImage,
    }

    const container = document.createElement('div')
    const root = createRoot(container)
    const captured = {
      state: null as null | ReturnType<typeof useComposerState>,
      actions: null as null | ReturnType<typeof useComposerActions>,
    }

    function Capture() {
      captured.state = useComposerState()
      captured.actions = useComposerActions()
      return null
    }

    await act(async () => {
      root.render(
        <ComposerProvider>
          <Capture />
        </ComposerProvider>,
      )
    })

    const file = new File(['hello'], 'diagram.png', { type: 'image/png' })
    Object.defineProperty(file, 'path', {
      configurable: true,
      value: '/tmp/diagram.png',
    })

    await act(async () => {
      await captured.actions?.attachFile(file)
    })

    expect(captured.state?.imageAttachment?.prepared).toBe(true)
    expect(captured.state?.uploadStatus).toBe('ready')
    expect(captured.state?.uploadError).toBeNull()

    await act(async () => {
      captured.actions?.markAttachmentAnalyzing(85)
    })

    expect(captured.state?.uploadStatus).toBe('analyzing')
    expect(captured.state?.uploadProgress).toBe(100)

    await act(async () => {
      captured.actions?.clearAttachmentAfterGeneration()
    })

    expect(captured.state?.imageAttachment).toBeNull()
    expect(captured.state?.uploadStatus).toBe('idle')
    expect(captured.state?.uploadError).toBeNull()
    expect(clearPreparedImage).toHaveBeenCalledWith('temp-1')

    await act(async () => {
      root.unmount()
    })
  })
})
