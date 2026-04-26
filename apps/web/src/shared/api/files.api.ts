import { apiRequest } from './http'

export type FileObject = {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  uploadedByUserId: string
  url: string
  createdAt: string
}

export function uploadFile(file: File, folder: string, token?: string | null) {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('folder', folder)

  return apiRequest<FileObject>('/files', {
    method: 'POST',
    body: formData,
    token
  })
}
