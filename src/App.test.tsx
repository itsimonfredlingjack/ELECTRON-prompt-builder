// @vitest-environment jsdom

import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/components/PromptComposer', () => ({
  PromptComposer: () => <section id="composer-placeholder" />,
}))

vi.mock('@/components/ResultPanel', () => ({
  ResultPanel: () => <section id="result-placeholder" />,
}))

vi.mock('@/components/TitleBar', () => ({
  TitleBar: () => <header id="title-bar" />,
}))

vi.mock('@/contexts/runtimeContext', () => ({
  useRuntimeState: () => ({
    runtimeSnapshot: {
      daemonReachable: true,
      modelListAvailable: true,
      models: [{ id: 'gemma4:e4b' }],
    },
    selectedModelReady: true,
    selectedModelVisionSupport: 'supported',
  }),
}))

import App from '@/App'

describe('App shell', () => {
  it('renders the two-column prompt workspace inside the main shell', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<App />)
    })

    expect(container.querySelector('#title-bar')).toBeTruthy()
    expect(container.querySelector('#composer-placeholder')).toBeTruthy()
    expect(container.querySelector('#result-placeholder')).toBeTruthy()

    expect(container.querySelector('.app-win')).toBeTruthy()
    expect(container.querySelector('main.ws')).toBeTruthy()
    expect(container.textContent).toContain('no cloud request sent')

    await act(async () => {
      root.unmount()
    })
  })
})
