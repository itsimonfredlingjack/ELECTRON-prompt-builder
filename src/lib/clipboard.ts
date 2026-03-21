type ClipboardBridge = {
  clipboardWrite?: (text: string) => Promise<boolean>
}

type ClipboardApi = {
  writeText: (text: string) => Promise<void>
}

export async function writeClipboardText(
  text: string,
  bridge?: ClipboardBridge,
  clipboardApi?: ClipboardApi,
): Promise<boolean> {
  if (!text) return false

  try {
    if (bridge?.clipboardWrite) {
      return await bridge.clipboardWrite(text)
    }

    if (clipboardApi?.writeText) {
      await clipboardApi.writeText(text)
      return true
    }

    return false
  } catch {
    return false
  }
}
