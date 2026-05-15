import { afterEach, describe, expect, it, vi } from 'vitest'
import { uploadFile } from './files.api'

const fetchMock = vi.fn()

describe('files api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('uploads files as multipart form data without forcing json content type', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        id: 'file-id',
        originalName: 'avatar.png',
        mimeType: 'image/png',
        sizeBytes: 12,
        uploadedByUserId: 'user-id',
        url: 'https://files.example/avatar.png',
        createdAt: '2026-04-26T00:00:00.000Z'
      }))
    })

    await uploadFile(new File(['avatar'], 'avatar.png', { type: 'image/png' }), 'avatars', 'access-token')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.headers.has('Content-Type')).toBe(false)
  })
})
