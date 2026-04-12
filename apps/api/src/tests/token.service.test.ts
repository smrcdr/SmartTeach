import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TokenService, type TokenPayload } from '../security/token.service'

function createTokenService() {
  return new TokenService({
    jwtAccessSecret: 'access-secret',
    jwtAccessTtlSeconds: 300,
    jwtRefreshSecret: 'refresh-secret',
    jwtRefreshTtlSeconds: 60 * 60 * 24 * 14,
    jwtAudience: 'smarteach-test-clients',
    jwtIssuer: 'smarteach-test-suite',
  } as never)
}

test('token service signs and verifies access tokens with auth context claims', () => {
  const service = createTokenService()
  const payload: TokenPayload = {
    sub: 'user-1',
    sessionId: 'session-1',
  }

  const accessToken = service.generateAccessToken(payload)
  const verifiedPayload = service.verifyAccessToken(accessToken)

  assert.equal(verifiedPayload.sub, payload.sub)
  assert.equal(verifiedPayload.sessionId, payload.sessionId)
  assert.equal(verifiedPayload.aud, 'smarteach-test-clients')
  assert.equal(verifiedPayload.iss, 'smarteach-test-suite')
  assert.ok(typeof verifiedPayload.exp === 'number')
  assert.ok(typeof verifiedPayload.iat === 'number')
  assert.ok(verifiedPayload.exp! > verifiedPayload.iat!)
})

test('token service keeps refresh tokens isolated from access-token verification', () => {
  const service = createTokenService()
  const refreshToken = service.generateRefreshToken({
    sub: 'user-2',
    sessionId: 'session-2',
  })

  const verifiedRefreshPayload = service.verifyRefreshToken(refreshToken)

  assert.equal(verifiedRefreshPayload.sub, 'user-2')
  assert.equal(verifiedRefreshPayload.sessionId, 'session-2')
  assert.throws(() => service.verifyAccessToken(refreshToken))
})
