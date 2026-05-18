import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveMinioPort } from '../storage/minio/minio.service'

test('resolveMinioPort prefers protocol defaults when endpoint omits a port', () => {
  assert.equal(resolveMinioPort(new URL('https://smartestcoder.site'), 9000), 443)
  assert.equal(resolveMinioPort(new URL('http://localhost'), 9000), 80)
})

test('resolveMinioPort keeps explicit endpoint ports intact', () => {
  assert.equal(resolveMinioPort(new URL('http://minio:9000'), 9000), 9000)
  assert.equal(resolveMinioPort(new URL('https://cdn.example.com:9443'), 9000), 9443)
})
