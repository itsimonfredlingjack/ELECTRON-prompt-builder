import { describe, expect, it } from 'vitest'
import { buildShareCardDataUrl, buildShareIntentText } from '@/lib/share'

describe('buildShareIntentText', () => {
  it('frames the transformation and includes a product CTA', () => {
    const text = buildShareIntentText({
      inputText: 'Turn my vague launch note into a crisp product update.',
      outputText: '<task>Write a concise product update with three punchy bullets.</task>',
      shareUrl: 'https://github.com/local/ai-prompt-builder',
    })

    expect(text).toContain('Rough idea in, production-ready prompt out')
    expect(text).toContain('Rough idea:')
    expect(text).toContain('Optimized prompt:')
    expect(text).toContain('Try it: https://github.com/local/ai-prompt-builder')
  })
})

describe('buildShareCardDataUrl', () => {
  it('returns an SVG data URL with escaped content and product context', () => {
    const dataUrl = buildShareCardDataUrl({
      inputText: 'Explain <GraphQL> rollout to the team',
      outputText: 'Write an update & include risks, owners, and next steps.',
      categoryLabel: 'Analysis / Summarization',
      modelLabel: 'GLM 4.7 Flash',
      shareUrl: 'https://github.com/local/ai-prompt-builder',
    })

    expect(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)

    const svg = decodeURIComponent(dataUrl.replace('data:image/svg+xml;charset=utf-8,', ''))

    expect(svg).toContain('AI Prompt Builder')
    expect(svg).toContain('Analysis / Summarization')
    expect(svg).toContain('GLM 4.7 Flash')
    expect(svg).toContain('Explain &lt;GraphQL&gt; rollout to the team')
    expect(svg).toContain('Write an update &amp; include risks, owners, and')
    expect(svg).toContain('next steps.')
    expect(svg).toContain('Try it: github.com/local/ai-prompt-builder')
  })
})
