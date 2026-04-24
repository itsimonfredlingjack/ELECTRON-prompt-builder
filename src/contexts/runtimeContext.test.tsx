// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RuntimeProvider, useRuntimeActions, useRuntimeState } from '@/contexts/runtimeContext'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function createRuntimeSnapshot(selectedModelId: string | null, notice: string | null) {
  return {
    daemonReachable: true,
    modelListAvailable: true,
    models: [{ id: 'llava:7b' }, { id: 'qwen2.5:7b' }],
    selectedModelId,
    selectedModelInstalled: !!selectedModelId,
    selectedModelReady: !!selectedModelId,
    selectedModelVisionSupport: selectedModelId === 'llava:7b' ? 'supported' as const : 'unsupported' as const,
    notice,
  }
}

describe('RuntimeProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('ignores stale refresh responses and keeps the latest runtime snapshot', async () => {
    const refreshResolvers: Array<(value: ReturnType<typeof createRuntimeSnapshot>) => void> = []
    const getRuntimeSnapshot = vi.fn(async ({ selectedModelId }: { selectedModelId: string | null }) =>
      createRuntimeSnapshot(selectedModelId, null),
    )
    const refreshRuntimeSnapshot = vi.fn(({ selectedModelId: _selectedModelId }: { selectedModelId: string | null }) =>
      new Promise<ReturnType<typeof createRuntimeSnapshot>>((resolve) => {
        refreshResolvers.push((snapshot) => resolve(snapshot))
      }),
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as Window & { electronAPI: any }).electronAPI = {
      getRuntimeSnapshot,
      refreshRuntimeSnapshot,
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    const captured = {
      state: null as null | ReturnType<typeof useRuntimeState>,
      actions: null as null | ReturnType<typeof useRuntimeActions>,
    }

    function Capture() {
      captured.state = useRuntimeState()
      captured.actions = useRuntimeActions()
      return null
    }

    await act(async () => {
      root.render(
        <RuntimeProvider>
          <Capture />
        </RuntimeProvider>,
      )
    })

    expect(captured.state?.selectedModelId).toBe('llava:7b')
    expect(captured.state?.selectedModelReady).toBe(true)

    await act(async () => {
      const firstRefresh = captured.actions?.refreshRuntime()
      const secondRefresh = captured.actions?.refreshRuntime()
      refreshResolvers[1]?.(createRuntimeSnapshot('llava:7b', 'newer refresh'))
      await secondRefresh
      refreshResolvers[0]?.(createRuntimeSnapshot('llava:7b', 'older refresh'))
      await firstRefresh
    })

    expect(captured.state?.notice).toBe('newer refresh')
    expect(captured.state?.runtimeSnapshot?.notice).toBe('newer refresh')

    await act(async () => {
      root.unmount()
    })
  })
})
