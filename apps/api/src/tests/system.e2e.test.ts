import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { createApp } from '../main'

type HealthResponse = {
  status: string
  timestamp: string
}

let app: INestApplication
let baseUrl: string

before(async () => {
  app = await createApp({
    enableSwagger: false,
  })
  await app.listen(0, '127.0.0.1')
  baseUrl = await app.getUrl()
})

after(async () => {
  if (app) {
    await app.close()
  }
})

test('health endpoint responds without auth', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`)
  const body = (await response.json()) as HealthResponse

  assert.equal(response.status, 200)
  assert.equal(body.status, 'ok')
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
})
