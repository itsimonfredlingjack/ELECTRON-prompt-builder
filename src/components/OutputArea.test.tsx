// @vitest-environment jsdom

import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { OutputArea } from '@/components/OutputArea'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('OutputArea', () => {
  it('shows clear and copy controls without any share/export action', () => {
    const html = renderToStaticMarkup(
      <OutputArea value="Clean up this rough prompt" isStreaming={false} onClear={() => undefined} />,
    )

    expect(html).toContain('Clear')
    expect(html).toContain('Copy')
    expect(html).not.toContain('Share')
    expect(html).toContain('Nothing is exported unless you copy it')
  })

  it('hides clear controls when output is empty', () => {
    const html = renderToStaticMarkup(
      <OutputArea value="" isStreaming={false} onClear={() => undefined} />,
    )

    expect(html).not.toContain('>Clear<')
    expect(html).not.toContain('>Copy<')
  })

  it('disables clear while streaming', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <OutputArea
          value="Clean up this rough prompt"
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
      return <OutputArea value={value} isStreaming={false} onClear={() => setValue('')} />
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
})
