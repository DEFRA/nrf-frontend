import { structureErrorForECS } from './log-formatters.js'

describe('#structureErrorForECS', () => {
  test('returns empty object for falsy input', () => {
    expect(structureErrorForECS(null)).toEqual({})
    expect(structureErrorForECS(undefined)).toEqual({})
  })

  test('returns error message and type for a basic Error', () => {
    const error = new Error('something went wrong')

    const result = structureErrorForECS(error)

    expect(result.error.message).toBe('something went wrong')
    expect(result.error.type).toBe('Error')
    expect(result.error.stack_trace).toBe(error.stack)
  })

  test('returns error type from error.name when set', () => {
    const error = new Error('custom')
    error.name = 'CustomError'

    const result = structureErrorForECS(error)

    expect(result.error.type).toBe('CustomError')
  })

  test('includes error code when present', () => {
    const error = new Error('enoent')
    error.code = 'ENOENT'

    const result = structureErrorForECS(error)

    expect(result.error.code).toBe('ENOENT')
  })

  test('omits code when not present', () => {
    const result = structureErrorForECS(new Error('no code'))

    expect(result.error).not.toHaveProperty('code')
  })

  test('does not include http field when no status code present', () => {
    const result = structureErrorForECS(new Error('no status'))

    expect(result).not.toHaveProperty('http')
  })

  test('extracts status code from error.statusCode', () => {
    const error = new Error('not found')
    error.statusCode = 404

    const result = structureErrorForECS(error)

    expect(result.http).toEqual({ response: { status_code: 404 } })
  })

  test('extracts status code from error.status', () => {
    const error = new Error('bad request')
    error.status = 400

    const result = structureErrorForECS(error)

    expect(result.http).toEqual({ response: { status_code: 400 } })
  })

  test('extracts status code from error.response.statusCode', () => {
    const error = new Error('upstream error')
    error.response = { statusCode: 502 }

    const result = structureErrorForECS(error)

    expect(result.http).toEqual({ response: { status_code: 502 } })
  })

  test('extracts status code from error.output.statusCode (Boom)', () => {
    const error = new Error('boom')
    error.output = { statusCode: 500 }

    const result = structureErrorForECS(error)

    expect(result.http).toEqual({ response: { status_code: 500 } })
  })

  test('appends response data payload to message when error.data is present', () => {
    const error = new Error('request failed')
    error.data = { reason: 'invalid input' }

    const result = structureErrorForECS(error)

    expect(result.error.message).toBe(
      'request failed | response: {"reason":"invalid input"}'
    )
  })

  test('appends string payload as-is', () => {
    const error = new Error('request failed')
    error.data = 'bad payload'

    const result = structureErrorForECS(error)

    expect(result.error.message).toBe('request failed | response: bad payload')
  })

  test('appends response.data payload to message when present', () => {
    const error = new Error('upstream failed')
    error.response = { data: { detail: 'timeout' } }

    const result = structureErrorForECS(error)

    expect(result.error.message).toBe(
      'upstream failed | response: {"detail":"timeout"}'
    )
  })

  test('falls back to String(error) when message is not a string', () => {
    const error = { message: 42, toString: () => 'stringified error' }

    const result = structureErrorForECS(error)

    expect(result.error.message).toBe('stringified error')
  })

  test('falls back to base message when payload cannot be serialised', () => {
    const error = new Error('serialisation failed')
    const circular = {}
    circular.self = circular
    error.data = circular

    const result = structureErrorForECS(error)

    expect(result.error.message).toBe('serialisation failed')
  })

  test('omits stack_trace when error has no stack', () => {
    const error = new Error('no stack')
    delete error.stack

    const result = structureErrorForECS(error)

    expect(result.error).not.toHaveProperty('stack_trace')
  })

  test('falls back to constructor name when error.name is falsy', () => {
    class DatabaseError extends Error {}
    const error = new DatabaseError('db error')
    error.name = ''

    const result = structureErrorForECS(error)

    expect(result.error.type).toBe('DatabaseError')
  })

  test('falls back to "Error" string when name and constructor name are absent', () => {
    const error = Object.assign(Object.create(null), { message: 'no proto' })

    const result = structureErrorForECS(error)

    expect(result.error.type).toBe('Error')
  })
})
