import { onBeforeUnmount, ref } from 'vue'

function revokePreviewUrl(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function useImagePreviewField(initialPreviewUrl: string | null = null) {
  const file = ref<File | null>(null)
  const previewUrl = ref<string | null>(initialPreviewUrl)

  function setPreviewUrl(nextPreviewUrl: string | null) {
    revokePreviewUrl(previewUrl.value)
    file.value = null
    previewUrl.value = nextPreviewUrl
  }

  function setFile(nextFile: File | null) {
    revokePreviewUrl(previewUrl.value)
    file.value = nextFile
    previewUrl.value = nextFile ? URL.createObjectURL(nextFile) : null
  }

  function clear() {
    setFile(null)
  }

  onBeforeUnmount(() => {
    revokePreviewUrl(previewUrl.value)
  })

  return {
    file,
    previewUrl,
    setPreviewUrl,
    setFile,
    clear
  }
}
