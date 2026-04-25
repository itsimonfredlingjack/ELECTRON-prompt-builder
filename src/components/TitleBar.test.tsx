// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const useRuntimeStateMock = vi.fn()
const refreshRuntimeMock = vi.fn()
const selectModelMock = vi.fn()

vi.mock('@/contexts/runtimeContext', () => ({
  useRuntimeState: () => useRuntimeStateMock(),
  useRuntimeActions: () => ({
    refreshRuntime: refreshRuntimeMock,
    selectModel: selectModelMock,
  }),
}))

import { TitleBar } from '@/components/TitleBar'

describe('TitleBar', () => {
  it('reserves space for native traffic lights without rendering fake controls', () => {
    useRuntimeStateMock.mockReturnValue({
      selectedModelId: null,
      runtimeSnapshot: {
        daemonReachable: false,
        modelListAvailable: false,
        models: [],
      },
      runtimeRefreshing: false,
      selectedModelReady: false,
      selectedModelInstalled: false,
    })

    const html = renderToStaticMarkup(<TitleBar />)

    // Check for the inline tailwind class that replaced .tb-native-spacer
    expect(html).toContain('w-[80px] h-[1px]')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('tb-traffic')
    expect(html).toContain('ollama offline')
  })
})
