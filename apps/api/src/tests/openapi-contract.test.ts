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

type OpenApiParameter = {
  name?: string
  in?: string
  schema?: {
    type?: string
    format?: string
  }
}

type OpenApiSchemaRef = {
  $ref?: string
}

type OpenApiMediaType = {
  schema?: OpenApiSchemaRef
}

type OpenApiResponse = {
  description?: string
  content?: {
    'application/json'?: OpenApiMediaType
  }
}

type OpenApiOperation = {
  description?: string
  requestBody?: unknown
  responses?: Record<string, OpenApiResponse>
}

type OpenApiDocument = {
  paths?: Record<string, Record<string, OpenApiOperation>>
  components?: {
    schemas?: Record<
      string,
      {
        properties?: Record<string, unknown>
      }
    >
  }
}

let app: INestApplication

const uuidPathParameterNames = new Set([
  'assignmentId',
  'chatId',
  'eventId',
  'fileId',
  'groupId',
  'lessonId',
  'messageId',
  'requestId',
  'submissionId',
  'userId',
])

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

test('runtime Swagger document marks UUID path parameters with format uuid', () => {
  const config = app.get(AppConfigService)
  const document = createOpenApiDocument(app, config.publicApiBaseUrl) as unknown as {
    paths?: Record<string, Record<string, { parameters?: OpenApiParameter[] }>>
  }
  const uuidPathParameters = collectUuidPathParameters(document)

  assert.ok(uuidPathParameters.length > 0)

  for (const parameter of uuidPathParameters) {
    assert.equal(parameter.schema?.type, 'string')
    assert.equal(parameter.schema?.format, 'uuid')
  }
})

test('runtime Swagger document keeps the cookie-based auth contract', () => {
  const config = app.get(AppConfigService)
  const document = createOpenApiDocument(
    app,
    config.publicApiBaseUrl,
  ) as unknown as OpenApiDocument
  const registerOperation = document.paths?.['/auth/register']?.post
  const loginOperation = document.paths?.['/auth/login']?.post
  const refreshOperation = document.paths?.['/auth/refresh']?.post
  const logoutOperation = document.paths?.['/auth/logout']?.post

  assert.ok(registerOperation)
  assert.ok(loginOperation)
  assert.ok(refreshOperation)
  assert.ok(logoutOperation)

  assert.equal(
    registerOperation.description,
    'Создает пользователя, стартовую сессию, выставляет refresh token в cookie и возвращает access token, sessionId и данные пользователя.',
  )
  assert.equal(refreshOperation.requestBody, undefined)
  assert.equal(logoutOperation.requestBody, undefined)
  assert.equal(
    registerOperation.responses?.['201']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/AuthSession',
  )
  assert.equal(
    loginOperation.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/AuthSession',
  )
  assert.equal(
    refreshOperation.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/TokenPair',
  )
  assert.deepEqual(Object.keys(logoutOperation.responses ?? {}), ['204'])
  assert.equal(
    document.components?.schemas?.AuthSession?.properties?.refreshToken,
    undefined,
  )
  assert.equal(
    document.components?.schemas?.TokenPair?.properties?.refreshToken,
    undefined,
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

function collectUuidPathParameters(document: {
  paths?: Record<string, Record<string, { parameters?: OpenApiParameter[] }>>
}) {
  return Object.values(document.paths ?? {}).flatMap((pathItem) =>
    Object.values(pathItem).flatMap((operation) =>
      (operation.parameters ?? []).filter(
        (parameter) =>
          parameter.in === 'path' &&
          typeof parameter.name === 'string' &&
          uuidPathParameterNames.has(parameter.name),
      ),
    ),
  )
}
