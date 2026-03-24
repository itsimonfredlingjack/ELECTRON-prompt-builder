import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

describe('Content Security Policy', () => {
  it('allows blob image previews in the development html policy', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8')
    expect(html).toContain("img-src 'self' data: https: blob:")
  })

  it('allows blob image previews in the packaged electron policy', () => {
    const mainProcessSource = fs.readFileSync(path.join(projectRoot, 'electron/main.ts'), 'utf8')
    expect(mainProcessSource).toContain("\"img-src 'self' data: https: blob:; \" +")
  })
})
