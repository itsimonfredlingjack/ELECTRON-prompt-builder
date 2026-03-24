// @vitest-environment jsdom

import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OutputArea } from '@/components/OutputArea'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('OutputArea', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows clear, share, and copy controls when output exists', () => {
    const html = renderToStaticMarkup(
      <OutputArea
        value="Clean up this rough prompt"
        sourceValue="make this prompt better"
        category="coding"
        isStreaming={false}
        onClear={() => undefined}
      />,
    )

    expect(html).toContain('Clear')
    expect(html).toContain('Share')
    expect(html).toContain('Copy')
    expect(html).toContain('Nothing leaves the app unless you copy or share it')
  })

  it('hides clear controls when output is empty', () => {
    const html = renderToStaticMarkup(
      <OutputArea
        value=""
        sourceValue=""
        category="coding"
        isStreaming={false}
        onClear={() => undefined}
      />,
    )

    expect(html).not.toContain('>Clear<')
    expect(html).not.toContain('>Share<')
    expect(html).not.toContain('>Copy<')
  })

  it('disables clear while streaming', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <OutputArea
          value="Clean up this rough prompt"
          sourceValue="make this prompt better"
          category="coding"
          isStreaming={true}
          onClear={() => undefined}
        />,
      )
    })

    const clearButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Clear'),
    )

    expect(clearButton).toBeTruthy()
    expect(clearButton?.hasAttribute('disabled')).toBe(true)

    await act(async () => {
      root.unmount()
    })
  })

  it('calls onClear when clear is clicked', async () => {
    const onClear = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <OutputArea
          value="Clean up this rough prompt"
          sourceValue="make this prompt better"
          category="coding"
          isStreaming={false}
          onClear={onClear}
        />,
      )
    })

    const clearButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Clear'),
    )

    expect(clearButton).toBeTruthy()

    await act(async () => {
      clearButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onClear).toHaveBeenCalledTimes(1)

    await act(async () => {
      root.unmount()
    })
  })

  it('shows a short cleared feedback message after clicking clear', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    function Harness() {
      const [value, setValue] = useState('Clean up this rough prompt')
      return (
        <OutputArea
          value={value}
          sourceValue="make this prompt better"
          category="coding"
          isStreaming={false}
          onClear={() => setValue('')}
        />
      )
    }

    await act(async () => {
      root.render(<Harness />)
    })

    const clearButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Clear'),
    )

    expect(clearButton).toBeTruthy()

    await act(async () => {
      clearButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.textContent).toContain('Output cleared.')

    await act(async () => {
      root.unmount()
    })
  })

  it('copies a share-ready before and after post and shows share feedback', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    })

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <OutputArea
          value="Create a concise React migration checklist with rollout steps."
          sourceValue="help me move this old react app to hooks"
          category="coding"
          isStreaming={false}
          onClear={() => undefined}
        />,
      )
    })

    const shareButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Share'),
    )

    expect(shareButton).toBeTruthy()

    await act(async () => {
      shareButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(clipboardWrite).toHaveBeenCalledTimes(1)
    expect(clipboardWrite.mock.calls[0]?.[0]).toContain('Before:')
    expect(clipboardWrite.mock.calls[0]?.[0]).toContain('After:')
    expect(container.textContent).toContain('Share-ready before/after copied.')
    expect(localStorage.getItem('ai-prompt-builder.share-metrics')).toContain('"share_copied":1')

    await act(async () => {
      root.unmount()
    })
  })
})
