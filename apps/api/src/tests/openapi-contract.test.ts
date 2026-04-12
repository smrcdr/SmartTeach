import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { INestApplication } from '@nestjs/common'
import { createApp } from '../main'
import { createOpenApiDocument } from '../common/swagger/openapi-document'
import { AppConfigService } from '../config/app-config.service'

type YamlModule = {
  load: (value: string) => unknown
}

let app: INestApplication

before(async () => {
  app = await createApp({
    enableSwagger: false,
  })
})

after(async () => {
  if (app) {
    await app.close()
  }
})

test('docs/openapi.yml stays in sync with runtime Swagger document', () => {
  const config = app.get(AppConfigService)
  const expectedDocument = createOpenApiDocument(app, config.publicApiBaseUrl)
  const yaml = require('js-yaml') as YamlModule
  const staticDocument = yaml.load(
    readFileSync(resolve(__dirname, '../../../../docs/openapi.yml'), 'utf8'),
  )

  assert.equal(
    JSON.stringify(canonicalize(staticDocument)),
    JSON.stringify(canonicalize(expectedDocument)),
  )
})

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  )
}
