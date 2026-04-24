import { describe, expect, it } from 'vitest'
import { resolveRuntimeSelection } from '@/lib/runtimeSelection'

describe('resolveRuntimeSelection', () => {
  it('auto-selects the first discovered model when nothing is selected yet', () => {
    expect(
      resolveRuntimeSelection(null, {
        daemonReachable: true,
        modelListAvailable: true,
        models: [{ id: 'qwen2.5:7b' }, { id: 'llava:7b' }],
        selectedModelId: null,
        selectedModelInstalled: false,
        selectedModelReady: false,
        selectedModelVisionSupport: 'unknown',
        notice: null,
      }),
    ).toEqual({
      nextModelId: 'qwen2.5:7b',
      notice: null,
      needsReload: true,
    })
  })

  it('switches to the first discovered model when the current model disappears', () => {
    expect(
      resolveRuntimeSelection('missing-model', {
        daemonReachable: true,
        modelListAvailable: true,
        models: [{ id: 'qwen2.5:7b' }, { id: 'llava:7b' }],
        selectedModelId: 'missing-model',
        selectedModelInstalled: false,
        selectedModelReady: false,
        selectedModelVisionSupport: 'unknown',
        notice: 'Selected model "missing-model" is not installed in Ollama.',
      }),
    ).toEqual({
      nextModelId: 'qwen2.5:7b',
      notice: 'Selected model "missing-model" is no longer installed. Switched to "qwen2.5:7b".',
      needsReload: true,
    })
  })
})
