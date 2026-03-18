const DEFAULT_SHARE_URL = 'https://github.com/local/ai-prompt-builder'

interface ShareIntentInput {
  inputText: string
  outputText: string
  shareUrl?: string
}

interface ShareCardInput extends ShareIntentInput {
  categoryLabel: string
  modelLabel: string
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function ellipsize(text: string, maxLength: number): string {
  const normalized = normalizeWhitespace(text)
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = ellipsize(text, maxChars * maxLines + maxLines).split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (candidate.length <= maxChars) {
      currentLine = candidate
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      lines.push(word.slice(0, maxChars - 1).trimEnd() + '…')
      currentLine = ''
    }

    if (lines.length === maxLines) {
      return lines.map((line, index) => (index === maxLines - 1 ? ellipsize(line, maxChars) : line))
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).map((line, index) => (index === maxLines - 1 ? ellipsize(line, maxChars) : line))
  }

  return lines
}

function toDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

function renderTextLines(lines: string[], x: number, y: number, lineHeight: number, className: string): string {
  return lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight
      return `<tspan x="${x}" dy="${dy}" class="${className}">${escapeXml(line)}</tspan>`
    })
    .join('')
}

export function buildShareIntentText({
  inputText,
  outputText,
  shareUrl = DEFAULT_SHARE_URL,
}: ShareIntentInput): string {
  return [
    'Rough idea in, production-ready prompt out with AI Prompt Builder.',
    '',
    `Rough idea: ${ellipsize(inputText, 120)}`,
    `Optimized prompt: ${ellipsize(outputText, 160)}`,
    '',
    `Try it: ${shareUrl}`,
  ].join('\n')
}

export function buildShareCardDataUrl({
  inputText,
  outputText,
  categoryLabel,
  modelLabel,
  shareUrl = DEFAULT_SHARE_URL,
}: ShareCardInput): string {
  const roughIdeaLines = wrapText(inputText, 40, 4)
  const promptLines = wrapText(outputText, 48, 6)
  const footerUrl = toDisplayUrl(shareUrl)
  const categoryMeta = `${categoryLabel} • ${modelLabel}`

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" fill="none">
  <defs>
    <linearGradient id="bg" x1="40" y1="24" x2="1160" y2="696" gradientUnits="userSpaceOnUse">
      <stop stop-color="#111725" />
      <stop offset="1" stop-color="#070A10" />
    </linearGradient>
    <linearGradient id="accent" x1="120" y1="0" x2="1080" y2="720" gradientUnits="userSpaceOnUse">
      <stop stop-color="#5EEAD4" stop-opacity="0.32" />
      <stop offset="1" stop-color="#60A5FA" stop-opacity="0.16" />
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="58" />
    </filter>
    <style>
      .eyebrow { fill: #8AA4C4; font: 600 22px Inter, Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; }
      .title { fill: #F8FAFC; font: 700 56px Inter, Arial, sans-serif; letter-spacing: -0.03em; }
      .meta { fill: #9FB4CE; font: 500 24px Inter, Arial, sans-serif; }
      .label { fill: #6EE7D8; font: 600 22px Inter, Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
      .body { fill: #E2E8F0; font: 500 28px Inter, Arial, sans-serif; }
      .footer { fill: #D9E2F0; font: 600 24px Inter, Arial, sans-serif; }
      .footer-subtle { fill: #8AA4C4; font: 500 20px Inter, Arial, sans-serif; }
    </style>
  </defs>
  <rect width="1200" height="720" rx="32" fill="url(#bg)" />
  <circle cx="980" cy="108" r="172" fill="url(#accent)" filter="url(#blur)" />
  <circle cx="226" cy="660" r="168" fill="url(#accent)" filter="url(#blur)" opacity="0.68" />
  <rect x="60" y="56" width="1080" height="608" rx="28" fill="rgba(8, 12, 22, 0.78)" stroke="rgba(148, 163, 184, 0.18)" />
  <text x="104" y="122" class="eyebrow">AI Prompt Builder</text>
  <text x="104" y="186" class="title">From rough idea to ready-to-run prompt</text>
  <text x="104" y="228" class="meta">${escapeXml(categoryMeta)}</text>

  <rect x="104" y="276" width="430" height="252" rx="24" fill="rgba(15, 23, 42, 0.72)" stroke="rgba(110, 231, 216, 0.16)" />
  <text x="136" y="330" class="label">Rough idea</text>
  <text x="136" y="382">${renderTextLines(roughIdeaLines, 136, 382, 38, 'body')}</text>

  <rect x="566" y="276" width="530" height="252" rx="24" fill="rgba(15, 23, 42, 0.72)" stroke="rgba(96, 165, 250, 0.18)" />
  <text x="598" y="330" class="label">Optimized prompt</text>
  <text x="598" y="382">${renderTextLines(promptLines, 598, 382, 38, 'body')}</text>

  <rect x="104" y="560" width="992" height="72" rx="20" fill="rgba(110, 231, 216, 0.12)" stroke="rgba(110, 231, 216, 0.22)" />
  <text x="136" y="604" class="footer">Try it: ${escapeXml(footerUrl)}</text>
  <text x="820" y="604" class="footer-subtle">Turn raw thinking into a polished prompt in seconds</text>
</svg>`.trim()

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export { DEFAULT_SHARE_URL }
