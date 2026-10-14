import { describe, expect, it } from 'vitest'
import joi from 'joi'
import { createSessionNamespace } from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'

const key = 'example'
const namespace = createSessionNamespace({
  key,
  schema: joi.object({
    colour: joi.string().valid('red', 'blue').optional().allow(null),
    size: joi.string().optional().allow(null)
  })
})

const buildRequest = (session) => createSessionRequest({ session })

describe('createSessionNamespace', () => {
  it('returns null when nothing has been stored', () => {
    expect(namespace.get(buildRequest())).toBeNull()
  })

  it('initialises to an empty object', () => {
    const request = buildRequest()

    namespace.init(request)

    expect(namespace.get(request)).toEqual({})
  })

  it('saves data and returns the merged result', () => {
    const request = buildRequest({ [key]: { colour: 'red' } })

    const result = namespace.save(request, { size: 'large' })

    expect(result).toEqual({ colour: 'red', size: 'large' })
    expect(namespace.get(request)).toEqual({ colour: 'red', size: 'large' })
  })

  it('overwrites an existing value and allows null to clear it', () => {
    const request = buildRequest({ [key]: { colour: 'red', size: 'large' } })

    const result = namespace.save(request, { colour: 'blue', size: null })

    expect(result).toEqual({ colour: 'blue', size: null })
  })

  it('creates the namespace when saving into nothing', () => {
    const request = buildRequest()

    expect(namespace.save(request, { colour: 'red' })).toEqual({
      colour: 'red'
    })
  })

  it('logs an error when the data does not match the schema', () => {
    const request = buildRequest()

    namespace.save(request, { colour: 'green' })

    expect(request.logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      `session namespace ${key}: invalid data on save`
    )
  })

  it('clears the stored data', () => {
    const request = buildRequest({ [key]: { colour: 'red' } })

    namespace.clear(request)

    expect(namespace.get(request)).toBeNull()
  })
})
