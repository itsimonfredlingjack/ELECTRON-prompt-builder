import { describe, expect, it } from 'vitest'
import { SYSTEM_PROMPTS } from '@/lib/prompts'

describe('SYSTEM_PROMPTS', () => {
  it('teaches the model to rewrite prompts instead of answering them', () => {
    for (const prompt of Object.values(SYSTEM_PROMPTS)) {
      expect(prompt).toContain('rewrite')
      expect(prompt).toContain('do not answer the task')
      expect(prompt).toContain('Output ONLY the improved prompt')
      expect(prompt).toContain('WRONG')
      expect(prompt).toContain('RIGHT')
    }
  })

  it('requires same-language output while preserving intent without over-inventing', () => {
    for (const prompt of Object.values(SYSTEM_PROMPTS)) {
      expect(prompt).toContain('SAME language')
      expect(prompt).toContain('Preserve the user')
      expect(prompt).toContain('Do not invent')
    }
  })

  it('forces placeholders instead of clarifying questions', () => {
    for (const prompt of Object.values(SYSTEM_PROMPTS)) {
      expect(prompt).toContain('NEVER ask clarifying questions')
      expect(prompt).toContain('Use [PLACEHOLDER]')
      expect(prompt).toContain('never ask for it')
      expect(prompt).toContain('exact token when important information is missing')
      expect(prompt).toContain('never invent alternative placeholder markers')
    }
  })

  it('avoids the old rigid XML and production-ready framing', () => {
    for (const prompt of Object.values(SYSTEM_PROMPTS)) {
      expect(prompt).not.toContain('production-ready prompt')
      expect(prompt).not.toContain('Use clear XML section delimiters')
      expect(prompt).not.toContain('<role>')
      expect(prompt).not.toContain('<context>')
    }
  })

  it('includes exactly one in-domain example per category prompt', () => {
    expect(SYSTEM_PROMPTS.coding.match(/USER INPUT:/g)).toHaveLength(1)
    expect(SYSTEM_PROMPTS.analysis.match(/USER INPUT:/g)).toHaveLength(1)
    expect(SYSTEM_PROMPTS.creative.match(/USER INPUT:/g)).toHaveLength(1)

    expect(SYSTEM_PROMPTS.coding).toContain('python api')
    expect(SYSTEM_PROMPTS.analysis).toContain('sammanfatta den här intervjun')
    expect(SYSTEM_PROMPTS.creative).toContain('brudparets bröllop')
  })

  it('keeps the prompts natural but structured instead of forcing a hard template', () => {
    expect(SYSTEM_PROMPTS.coding).toContain('Match complexity to the input')
    expect(SYSTEM_PROMPTS.coding).toContain('keep the improved prompt short and direct')
    expect(SYSTEM_PROMPTS.coding).toContain("input is under 15 words, keep the improved prompt under 6 lines")
    expect(SYSTEM_PROMPTS.coding).toContain('headings or lists when they help')

    expect(SYSTEM_PROMPTS.analysis).toContain('Match complexity to the input')
    expect(SYSTEM_PROMPTS.analysis).toContain('keep the improved prompt short and direct')
    expect(SYSTEM_PROMPTS.analysis).toContain('compact rewrite of about 2 to 6 lines')
    expect(SYSTEM_PROMPTS.analysis).toContain('headings or lists when they help')

    expect(SYSTEM_PROMPTS.creative).toContain('Match complexity to the input')
    expect(SYSTEM_PROMPTS.creative).toContain('keep the improved prompt short and direct')
    expect(SYSTEM_PROMPTS.creative).toContain('compact rewrite of about 2 to 6 lines')
    expect(SYSTEM_PROMPTS.creative).toContain('headings or lists when they help')
  })

  it('teaches compact rewrites for simple inputs', () => {
    expect(SYSTEM_PROMPTS.coding).toContain('SHORT EXAMPLE:')
    expect(SYSTEM_PROMPTS.coding).toContain('regex for email')
    expect(SYSTEM_PROMPTS.coding).toContain('dockerfile for a node app')
    expect(SYSTEM_PROMPTS.analysis).toContain('summarize this meeting')
    expect(SYSTEM_PROMPTS.creative).toContain('instagram caption for a coffee photo')
  })

  it('places the shortest coding example before the medium debugging example', () => {
    expect(SYSTEM_PROMPTS.coding.indexOf('regex for email')).toBeLessThan(
      SYSTEM_PROMPTS.coding.indexOf('fix my python api that keeps crashing'),
    )
  })
})
