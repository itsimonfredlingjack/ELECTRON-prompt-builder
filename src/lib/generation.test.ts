import { describe, expect, it } from 'vitest'
import type { ImageAttachment } from '@/types'
import { createGenerationRequest } from '@/lib/generation'

describe('createGenerationRequest', () => {
  it('omits imageTempId when no image is attached', () => {
    expect(
      createGenerationRequest({
        model: 'qwen3.5:4b',
        systemPrompt: 'system',
        userInput: 'hello world',
        imageAttachment: null,
      }),
    ).toEqual({
      model: 'qwen3.5:4b',
      systemPrompt: 'system',
      userInput: 'hello world',
      imageTempId: undefined,
    })
  })

  it('includes imageTempId when an image is attached', () => {
    const imageAttachment: ImageAttachment = {
      name: 'diagram.png',
      size: 123,
      mimeType: 'image/png',
      previewUrl: 'blob:test',
      tempId: 'temp-1',
      prepared: true,
    }

    expect(
      createGenerationRequest({
        model: 'qwen3.5:4b',
        systemPrompt: 'system',
        userInput: 'hello world',
        imageAttachment,
      }),
    ).toEqual({
      model: 'qwen3.5:4b',
      systemPrompt: 'system',
      userInput: 'hello world',
      imageTempId: 'temp-1',
    })
  })
})
