import type { INestApplication } from '@nestjs/common'
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger'

const OPENAPI_DESCRIPTION = `
Актуальная спецификация REST API для MVP проекта SmartTeach.
Спецификация обновлена после пересмотра предметной области и синхронизирована
с новой структурой базы данных, зафиксированной в \`docs/07-database-structure.md\`.

Основные принципы текущего API:
- центральная сущность системы — группа;
- \`class\` и \`course\` в MVP не выделяются;
- у группы есть отдельные настройки функций;
- вступление в группу зависит от \`accessMode\`;
- используются локальная авторизация и refresh-сессии;
- поддерживаются групповые и личные чаты \`1 на 1\`;
- расписание строится из уроков, дедлайнов заданий и кастомных событий.
`.trim()

type OpenApiRecord = Record<string, unknown>

type OpenApiTag = {
  name: string
  description: string
}

type OpenApiSecurityRequirement = Record<string, string[]>

type OpenApiOperation = OpenApiRecord & {
  operationId?: string
  parameters?: unknown[]
  responses?: OpenApiRecord
  security?: unknown
}

const OPENAPI_TAGS: OpenApiTag[] = [
  {
    name: 'System',
    description: 'Служебные маршруты API',
  },
  {
    name: 'Authentication',
    description: 'Регистрация, вход и работа с JWT-сессией',
  },
  {
    name: 'Users',
    description: 'Профили пользователей',
  },
  {
    name: 'Files',
    description: 'Загрузка и получение файлов',
  },
  {
    name: 'Groups',
    description: 'Работа с группами',
  },
  {
    name: 'Group Settings',
    description: 'Настройки функций группы',
  },
  {
    name: 'Group Members',
    description: 'Состав участников группы и роли',
  },
  {
    name: 'Join Requests',
    description: 'Заявки на вступление в группы с режимом BY_REQUEST',
  },
  {
    name: 'Lessons',
    description: 'Уроки внутри группы',
  },
  {
    name: 'Assignments',
    description: 'Задания и попытки сдачи',
  },
  {
    name: 'Schedule',
    description: 'Календарь группы и кастомные события',
  },
  {
    name: 'Chats',
    description: 'Групповые и личные чаты',
  },
]

const BEARER_AUTH: OpenApiSecurityRequirement = {
  bearerAuth: [],
}

const OPENAPI_SERVER_DESCRIPTION = 'Локальный REST API'

export function createOpenApiDocument(
  app: INestApplication,
  publicApiBaseUrl: string,
) {
  const normalizedServerUrl = createNormalizedServerUrl(publicApiBaseUrl)
  const builder = new DocumentBuilder()
    .setTitle('SmartTeach API')
    .setVersion('0.2.0')
    .setDescription(OPENAPI_DESCRIPTION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth',
    )
    .addServer(normalizedServerUrl, OPENAPI_SERVER_DESCRIPTION)

  for (const tag of OPENAPI_TAGS) {
    builder.addTag(tag.name, tag.description)
  }

  const document = SwaggerModule.createDocument(app, builder.build(), {
    ignoreGlobalPrefix: true,
  })

  document.openapi = '3.0.3'
  document.info = {
    title: 'SmartTeach API',
    version: '0.2.0',
    description: OPENAPI_DESCRIPTION,
  }
  document.servers = [
    {
      url: normalizedServerUrl,
      description: OPENAPI_SERVER_DESCRIPTION,
    },
  ]
  document.tags = [...OPENAPI_TAGS]

  return normalizeOpenApiDocument(document)
}

function normalizeOpenApiDocument(document: OpenAPIObject) {
  const normalizedPaths = sortObjectEntries(
    mapObjectEntries(document.paths, (path, pathItem) => [
      path.replace(/^\/v1/, ''),
      normalizePathItem(pathItem as OpenApiRecord),
    ]),
  )

  if (document.components?.schemas) {
    document.components.schemas = sortObjectEntries(
      mapObjectEntries(document.components.schemas, (schemaName, schema) => [
        stripDtoSuffix(schemaName),
        schema,
      ]),
    )
  }

  visitOpenApiValue(document, (value, key, parent) => {
    if (key === '$ref' && typeof value === 'string') {
      parent[key] = value.replace(
        /^#\/components\/schemas\/(.+)Dto$/,
        '#/components/schemas/$1',
      )
    }
  })

  return {
    openapi: document.openapi,
    info: document.info,
    servers: document.servers,
    tags: document.tags,
    paths: normalizedPaths,
    components: document.components,
  }
}

function normalizePathItem(pathItem: OpenApiRecord) {
  const entries = Object.entries(pathItem).filter(([, value]) => value !== undefined)

  return sortObjectEntries(
    Object.fromEntries(
      entries.map(([key, value]) => {
        if (!isOperationObject(value)) {
          return [key, value]
        }

        return [key, normalizeOperation(value)]
      }),
    ),
  )
}

function normalizeOperation(operation: OpenApiOperation) {
  const normalizedOperation = sortObjectEntries({
    ...operation,
  }) as OpenApiOperation

  delete normalizedOperation.operationId

  if (Array.isArray(normalizedOperation.parameters)) {
    normalizedOperation.parameters = normalizedOperation.parameters.filter(Boolean)

    if (normalizedOperation.parameters.length === 0) {
      delete normalizedOperation.parameters
    }
  }

  if (isDefaultBearerSecurity(normalizedOperation.security)) {
    normalizedOperation.security = [BEARER_AUTH]
  }

  if (normalizedOperation.responses) {
    normalizedOperation.responses = sortObjectEntries(normalizedOperation.responses)
  }

  return normalizedOperation
}

function isOperationObject(value: unknown): value is OpenApiOperation {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'responses' in value
}

function isDefaultBearerSecurity(security: unknown) {
  return JSON.stringify(security) === JSON.stringify([BEARER_AUTH])
}

function visitOpenApiValue(
  value: unknown,
  visitor: (value: unknown, key: string, parent: Record<string, unknown>) => void,
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      visitOpenApiValue(item, visitor)
    }
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  const record = value as Record<string, unknown>

  for (const [key, entry] of Object.entries(record)) {
    visitor(entry, key, record)
    visitOpenApiValue(record[key], visitor)
  }
}

function stripDtoSuffix(value: string) {
  return value.endsWith('Dto') ? value.slice(0, -3) : value
}

function createNormalizedServerUrl(publicApiBaseUrl: string) {
  const url = new URL(`${publicApiBaseUrl}/api/v1`)

  if (url.hostname === '127.0.0.1') {
    url.hostname = 'localhost'
  }

  return url.toString().replace(/\/$/, '')
}

function mapObjectEntries<Value>(
  object: Record<string, Value>,
  mapper: (key: string, value: Value) => [string, Value],
) {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => mapper(key, value)),
  )
}

function sortObjectEntries<Value>(object: Record<string, Value>) {
  return Object.fromEntries(
    Object.entries(object).sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey),
    ),
  )
}
