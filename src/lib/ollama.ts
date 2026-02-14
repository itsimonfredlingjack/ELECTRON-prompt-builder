import { OllamaModel, OllamaGenerateResponse } from '@/types'

const OLLAMA_BASE_URL = 'http://localhost:11434'

export async function listModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`)
    }
    const data = await response.json()
    return (data.models || []).map((m: OllamaModel) => m.name)
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Ollama is not running. Please start Ollama and try again.')
    }
    throw error
  }
}

export async function* generateStream(
  model: string,
  systemPrompt: string,
  userInput: string,
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: userInput,
      system: systemPrompt,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Model "${model}" not found. Please select another model.`)
    }
    throw new Error(`Ollama returned ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body from Ollama')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json: OllamaGenerateResponse = JSON.parse(line)
            if (json.response) {
              yield json.response
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Generation stopped.'
    }
    if (error.message.includes('fetch')) {
      return 'Cannot connect to Ollama. Is it running on localhost:11434?'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}
