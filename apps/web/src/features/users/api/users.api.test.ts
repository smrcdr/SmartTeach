import { afterEach, describe, expect, it, vi } from 'vitest'
import { updateMyProfile } from './users.api'

const fetchMock = vi.fn()

describe('users api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('patches the current user profile through the backend endpoint', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        id: 'user-id',
        email: 'student@smarteach.local',
        displayName: 'Updated Student',
        bio: 'Новая биография',
        avatarFileId: null,
        avatarUrl: null
      }))
    })

    await updateMyProfile({
      displayName: 'Updated Student',
      bio: 'Новая биография',
      avatarFileId: null
    }, 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/users/me', expect.objectContaining({
      method: 'PATCH',
      credentials: 'include'
    }))
    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({
      displayName: 'Updated Student',
      bio: 'Новая биография',
      avatarFileId: null
    })
  })
})
