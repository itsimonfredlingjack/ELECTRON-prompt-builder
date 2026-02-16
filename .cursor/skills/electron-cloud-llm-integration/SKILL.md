---
name: electron-cloud-llm-integration
description: Integrate cloud LLM APIs (OpenAI-compatible, Z.AI GLM) with Electron apps. Secure API key storage, streaming responses, and throttled renderer updates. Use when adding AI/LLM features to Electron apps or implementing chat completions with streaming.
---

# Electron + Cloud LLM Integration

## Architecture

- **Main process**: Store API key (electron-store + safeStorage), expose get/set via IPC.
- **Renderer**: Fetch from API directly (add domain to CSP). Never pass raw API key through IPC in logs or errors.

## API Key Flow

1. User enters key in Settings UI.
2. Renderer calls `window.electronAPI.setApiKey(key)`.
3. Main encrypts with `safeStorage.encryptString()`, stores in electron-store.
4. On load: main decrypts, returns via `getApiKey`; renderer keeps in React state for API calls.

## OpenAI-Compatible Streaming (Z.AI, OpenAI, etc.)

Endpoint pattern: `POST /chat/completions`, `stream: true`, SSE response.

```typescript
async function* generateStream(apiKey: string, model: string, messages: Message[], signal: AbortSignal) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
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
        if (line.trim().startsWith('data: ') && !line.includes('[DONE]')) {
          const json = JSON.parse(line.slice(6))
          const content = json.choices?.[0]?.delta?.content
          if (content) yield content
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
```

## Throttle Stream Updates

Avoid re-rendering on every chunk:

```typescript
const UPDATE_INTERVAL_MS = 50
let pending = ''
let lastUpdate = 0

for await (const chunk of generateStream(...)) {
  pending += chunk
  const now = Date.now()
  if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
    lastUpdate = now
    setState(prev => ({ ...prev, outputText: pending }))
  }
}
setState(prev => ({ ...prev, outputText: pending, isStreaming: false }))
```

## Abort Handling

Pass `AbortController.signal` to fetch; on user "Stop", call `abortController.abort()`. Catch `AbortError` and preserve `pending` output when stopping.

## Z.AI GLM Specifics

- Base URL: `https://api.z.ai/api/paas/v4`
- Auth: `Authorization: Bearer <api_key>`
- Models: `glm-5`, `glm-4.7`, `glm-4.7-flash`, `glm-4.6`, `glm-4.5`
- Request: `{ model, messages: [{role, content}], stream: true, temperature: 0.7, max_tokens: 4096 }`
- No model-list endpoint; use hardcoded list.

## CSP

Allow the API domain:

```
connect-src 'self' https://api.z.ai
```
