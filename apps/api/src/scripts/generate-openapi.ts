import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createApp } from '../main'
import { AppConfigService } from '../config/app-config.service'
import { createOpenApiDocument } from '../common/swagger/openapi-document'

type YamlModule = {
  dump: (value: unknown, options?: Record<string, unknown>) => string
}

async function main() {
  const app = await createApp({
    enableSwagger: false,
  })

  try {
    const config = app.get(AppConfigService)
    const document = createOpenApiDocument(app, config.publicApiBaseUrl)
    const yaml = require('js-yaml') as YamlModule
    const outputPaths = [
      resolve(__dirname, '../../../../docs/openapi.yml'),
      resolve(__dirname, '../../../../apps/web/public/openapi.yml'),
    ]
    const yamlDocument = yaml.dump(document, {
      lineWidth: -1,
      noRefs: true,
      quotingType: "'",
      sortKeys: false,
    })

    for (const outputPath of outputPaths) {
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, yamlDocument)
    }
  } finally {
    await app.close()
  }
}

void main()
