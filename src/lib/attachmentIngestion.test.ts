import { describe, expect, it } from 'vitest'
import {
  beginAttachmentOperation,
  canHandleAttachmentDrop,
  isCurrentAttachmentOperation,
} from '@/lib/attachmentIngestion'

describe('attachment ingestion operation tracking', () => {
  it('treats newer overlapping attachment operations as authoritative', () => {
    const op1 = beginAttachmentOperation(0)
    const op2 = beginAttachmentOperation(op1)

    expect(isCurrentAttachmentOperation(op2, op1)).toBe(false)
    expect(isCurrentAttachmentOperation(op2, op2)).toBe(true)
  })

  it('marks stale async completion as non-current so it cannot win', () => {
    const op1 = beginAttachmentOperation(0)
    const op2 = beginAttachmentOperation(op1)
    const op3 = beginAttachmentOperation(op2)

    expect(isCurrentAttachmentOperation(op3, op1)).toBe(false)
    expect(isCurrentAttachmentOperation(op3, op2)).toBe(false)
    expect(isCurrentAttachmentOperation(op3, op3)).toBe(true)
  })
})

describe('attachment drop interaction guard', () => {
  it('blocks drag/drop while generation is active', () => {
    expect(canHandleAttachmentDrop(true, true)).toBe(false)
  })

  it('allows drag/drop only when generation is idle and attachment is permitted', () => {
    expect(canHandleAttachmentDrop(false, true)).toBe(true)
    expect(canHandleAttachmentDrop(false, false)).toBe(false)
  })
})
