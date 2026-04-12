import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BadRequestException, type ArgumentsHost } from '@nestjs/common'
import { AllExceptionsFilter } from '../common/exception-filters/all-exceptions.filter'

function createHttpHost() {
  const responseState = {
    statusCode: 200,
    body: undefined as unknown,
  }

  const response = {
    status(code: number) {
      responseState.statusCode = code
      return this
    },
    json(payload: unknown) {
      responseState.body = payload
      return this
    },
  }

  const host = {
    switchToHttp() {
      return {
        getRequest() {
          return {
            method: 'GET',
            originalUrl: '/test',
          }
        },
        getResponse() {
          return response
        },
      }
    },
  } as ArgumentsHost

  return {
    host,
    responseState,
  }
}

test('does not leak internal error messages for non-HTTP 500 errors', () => {
  const filter = new AllExceptionsFilter()
  const { host, responseState } = createHttpHost()

  filter.catch(new Error('postgres password leaked'), host)

  assert.equal(responseState.statusCode, 500)
  assert.deepEqual(responseState.body, {
    statusCode: 500,
    message: 'Internal server error',
  })
})

test('keeps validation error details for client-facing 400 responses', () => {
  const filter = new AllExceptionsFilter()
  const { host, responseState } = createHttpHost()

  filter.catch(
    new BadRequestException({
      message: 'Validation failed',
      errors: ['email: Invalid email address'],
    }),
    host,
  )

  assert.equal(responseState.statusCode, 400)
  assert.deepEqual(responseState.body, {
    statusCode: 400,
    message: 'Validation failed',
    errors: ['email: Invalid email address'],
  })
})
