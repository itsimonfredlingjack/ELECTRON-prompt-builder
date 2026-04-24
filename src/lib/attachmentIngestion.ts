export function beginAttachmentOperation(currentOperationId: number): number {
  return currentOperationId + 1
}

export function isCurrentAttachmentOperation(activeOperationId: number, operationId: number): boolean {
  return activeOperationId === operationId
}

export function canHandleAttachmentDrop(isGenerating: boolean, canAttachImage: boolean): boolean {
  return !isGenerating && canAttachImage
}
