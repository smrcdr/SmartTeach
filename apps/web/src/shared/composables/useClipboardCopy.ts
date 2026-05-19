import { onBeforeUnmount, ref } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'

export function useClipboardCopy(timeoutMs = 1400) {
  const isCopied = ref(false)
  let copiedStateTimer: ReturnType<typeof setTimeout> | null = null

  function resetCopiedState() {
    if (copiedStateTimer) {
      clearTimeout(copiedStateTimer)
      copiedStateTimer = null
    }

    isCopied.value = false
  }

  async function copy(value: string) {
    const copied = await copyTextToClipboard(value)

    if (!copied) {
      resetCopiedState()
      return false
    }

    isCopied.value = true

    if (copiedStateTimer) {
      clearTimeout(copiedStateTimer)
    }

    copiedStateTimer = setTimeout(() => {
      isCopied.value = false
      copiedStateTimer = null
    }, timeoutMs)

    return true
  }

  onBeforeUnmount(() => {
    if (copiedStateTimer) {
      clearTimeout(copiedStateTimer)
    }
  })

  return {
    isCopied,
    copy,
    resetCopiedState
  }
}
