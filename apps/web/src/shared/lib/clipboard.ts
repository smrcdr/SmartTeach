export async function copyTextToClipboard(value: string): Promise<boolean> {
  let fallbackTextarea: HTMLTextAreaElement | null = null

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }

    fallbackTextarea = document.createElement('textarea')
    fallbackTextarea.value = value
    fallbackTextarea.setAttribute('readonly', '')
    fallbackTextarea.style.position = 'absolute'
    fallbackTextarea.style.left = '-9999px'
    document.body.appendChild(fallbackTextarea)
    fallbackTextarea.select()

    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    fallbackTextarea?.remove()
  }
}
