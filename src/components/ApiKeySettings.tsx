import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'

export function ApiKeySettings() {
  const { apiKeyConfigured, setApiKey } = useApp()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await setApiKey(input.trim())
      setInput('')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (saving) return
    setSaving(true)
    try {
      await setApiKey('')
      setInput('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="section-label">
        Z.AI API Key
      </label>
      <p className="text-xs text-ghost-muted">
        Get your key from{' '}
        <a
          href="https://z.ai/manage-apikey/apikey-list"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          z.ai/manage-apikey
        </a>{' '}
        (requires GLM Coding Plan subscription).
      </p>
      <div className="flex gap-2">
        <input
          type={showKey ? 'text' : 'password'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={apiKeyConfigured ? 'Enter new key to replace...' : 'sk-...'}
          className="flex-1 px-3 py-2.5 text-xs font-mono text-ghost-bright bg-void border border-void-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-ghost-dim placeholder:font-sans transition-colors duration-200"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="px-3 py-2.5 text-ghost-muted hover:text-ghost rounded-lg surface"
          title={showKey ? 'Hide' : 'Show'}
        >
          {showKey ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        <button
          onClick={handleSave}
          disabled={!input.trim() || saving}
          className="px-4 py-2.5 text-xs font-medium btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '...' : 'Save'}
        </button>
        {apiKeyConfigured && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="px-4 py-2.5 text-xs font-medium text-ghost-bright rounded-lg surface hover:border-signal-error/50 hover:bg-signal-error/5 disabled:opacity-50 transition-colors duration-200"
          >
            Clear
          </button>
        )}
      </div>
      {apiKeyConfigured && !input && (
        <p className="text-xs text-signal-success">API key configured and stored securely.</p>
      )}
    </div>
  )
}
