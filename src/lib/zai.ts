/**
 * Z.AI GLM API client - OpenAI-compatible chat completions with streaming.
 * @see https://docs.z.ai/api-reference/llm/chat-completion
 * @see https://docs.z.ai/guides/capabilities/streaming
 */

const ZAI_API_BASE = 'https://api.z.ai/api/paas/v4'

export const GLM_MODELS = ['glm-4.5-flash', 'glm-4.7-flash'] as const

export type GLMModel = (typeof GLM_MODELS)[number]

export const DEFAULT_MODEL: GLMModel = 'glm-4.5-flash'

export async function checkConnection(apiKey: string): Promise<boolean> {
  if (!apiKey?.trim()) return false
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${ZAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
        max_tokens: 2,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.status === 401) return false
    return res.ok || res.status === 400 || res.status === 429
  } catch {
    clearTimeout(timeoutId)
    return false
  }
}

export async function* generateStream(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userInput: string,
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const key = apiKey?.trim()
  if (!key) {
    throw new Error('API key is required. Configure it in Settings.')
  }

  const response = await fetch(`${ZAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    }),
    signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const errObj = err as { error?: { code?: string; message?: string }; message?: string }
    const msg = errObj?.error?.message || errObj?.message || response.statusText

    if (response.status === 401) {
      throw new Error('Invalid API key. Check your Z.AI API key in Settings.')
    }
    if (response.status === 429 || /insufficient balance|recharge|arrears|expired|quota/i.test(msg)) {
      throw new Error(
        `${msg}\n\n` +
        '• Check balance: https://z.ai/manage-apikey/billing\n' +
        '• Renew subscription: https://z.ai/subscribe'
      )
    }
    throw new Error(msg || `Z.AI API returned ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body from Z.AI')
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
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6)) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Skip malformed SSE lines
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
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return 'Cannot connect to Z.AI. Check your network and API key.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}
