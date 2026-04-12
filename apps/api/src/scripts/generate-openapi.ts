import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
    const outputPath = resolve(__dirname, '../../../../docs/openapi.yml')
    const yamlDocument = yaml.dump(document, {
      lineWidth: -1,
      noRefs: true,
      quotingType: "'",
      sortKeys: false,
    })

    writeFileSync(outputPath, yamlDocument)
  } finally {
    await app.close()
  }
}

void main()
