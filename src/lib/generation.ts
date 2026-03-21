import type { ImageAttachment, MultimodalGenerateRequest } from '@/types'

interface CreateGenerationRequestInput {
  model: string
  systemPrompt: string
  userInput: string
  imageAttachment: ImageAttachment | null
}

export function createGenerationRequest({
  model,
  systemPrompt,
  userInput,
  imageAttachment,
}: CreateGenerationRequestInput): MultimodalGenerateRequest {
  return {
    model,
    systemPrompt,
    userInput,
    imageTempId: imageAttachment?.tempId ?? undefined,
  }
}
