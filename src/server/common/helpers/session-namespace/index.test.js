import { describe, expect, it } from 'vitest'
import joi from 'joi'
import { createSessionNamespace } from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'

const key = 'example'
const RED = 'red'
const BLUE = 'blue'
const LARGE = 'large'
const namespace = createSessionNamespace({
  key,
  schema: joi.object({
    colour: joi.string().valid(RED, BLUE).optional().allow(null),
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
    const request = buildRequest({ [key]: { colour: RED } })

    const result = namespace.save(request, { size: LARGE })

    expect(result).toEqual({ colour: RED, size: LARGE })
    expect(namespace.get(request)).toEqual({ colour: RED, size: LARGE })
  })

  it('overwrites an existing value and allows null to clear it', () => {
    const request = buildRequest({ [key]: { colour: RED, size: LARGE } })

    const result = namespace.save(request, { colour: BLUE, size: null })

    expect(result).toEqual({ colour: BLUE, size: null })
  })

  it('creates the namespace when saving into nothing', () => {
    const request = buildRequest()

    expect(namespace.save(request, { colour: RED })).toEqual({
      colour: RED
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
    const request = buildRequest({ [key]: { colour: RED } })

    namespace.clear(request)

    expect(namespace.get(request)).toBeNull()
  })
})
