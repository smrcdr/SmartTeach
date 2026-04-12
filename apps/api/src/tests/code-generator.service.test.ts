import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CodeGeneratorService } from '../common/code-generator.service'

test('group code generator returns six symbols from the allowed alphabet', () => {
  const service = new CodeGeneratorService()
  const generatedCodes = Array.from({ length: 64 }, () => service.generateGroupCode())

  assert.ok(generatedCodes.every((code) => /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)))
  assert.ok(new Set(generatedCodes).size > 1)
})
